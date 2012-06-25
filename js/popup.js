//	Metalink Downloader-Chrome Extension
//	Copyright (C) 2012  
//	Developed by :	Sundaram Ananthanarayanan, Anthony Bryan

//	This program is free software: you can redistribute it and/or modify
//	it under the terms of the GNU General Public License as published by
//	the Free Software Foundation, either version 3 of the License, or
//	(at your option) any later version.

//	This program is distributed in the hope that it will be useful,
//	but WITHOUT ANY WARRANTY; without even the implied warranty of
//	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//	GNU General Public License for more details.

//	You should have received a copy of the GNU General Public License
//	along with this program.  If not, see <http://www.gnu.org/licenses/>

var keys=[];
var elements=[];
var backgroundView;
var objects;
var lastLength;
const DOWNLOADS_KEY="PREVIOUS_DOWNLOADS";
$(document).ready
(
	function()
	{
		function getProgressBar(percent,status)
		{
			spanElement=$('<span style="width: '+percent+'%" id="progressbarspan"><span></span></span>');
			switch(status)
			{
				case 'Downloading':
					divContainer=$('<div class="meter animate blue" id="progressbardiv"></div>');
					divContainer.append(spanElement);
					return divContainer;
				case 'Paused':
					divContainer=$('<div class="meter nostripes blue" id="progressbardiv"></div>');
					divContainer.append(spanElement);
					return divContainer;
				case 'Verifying':
					divContainer=$('<div class="meter animate orange" id="progressbardiv"></div>');
					divContainer.append(spanElement);
					return divContainer;
				case 'Completed':
					divContainer=$('<div class="meter nostripes" id="progressbardiv"></div>');
					divContainer.append(spanElement);
					return divContainer;
				case 'Failed':
					divContainer=$('<div class="meter nostripes red" id="progressbardiv"></div>');
					divContainer.append(spanElement);
					return divContainer;				
			};
		}
		function updateProgressBar(index,percent,status)
		{
			div=elements[index];
			$("#progressbarspan",div).attr('style','width: '+percent+'%');
			switch(status)
			{
				case 'Downloading':
					$("#progressbardiv",div).attr('class','meter animate blue');
					return;
				case 'Paused':
					$("#progressbardiv",div).attr('class','meter nostripes blue');
					return;
				case 'Verifying':
					$("#progressbardiv",div).attr('class','meter animate orange');
					return
				case 'Completed':
					$("#progressbardiv",div).attr('class','meter nostripes');
					return;				
				case 'Failed':
					$("#progressbardiv",div).attr('class','meter nostripes red');
					return;
			};
		}
		function pause_handler()
		{
			if($(this).text()=="pause")
			{
				$(this).text("resume");
				chrome.extension.sendRequest({data: parseInt($(this).attr('href')), cmd:"PAUSE"});
				return false;
			}
			$(this).text("pause");
			chrome.extension.sendRequest({data: parseInt($(this).attr('href')), cmd:"RESUME"});
			return false;
		}
		function removeDiv(index)
		{
			div=elements[index];
			div.hide('slow');
		}
		function updateDiv(index,status,progress,fileSize)
		{
			div=elements[index];
			/*
			if(status=='Verifying'||status=='Restarting')
				$("progress",div).removeAttr('value');
			else
				$("progress",div).attr('value',progress);
			*/
			updateProgressBar(index,progress,status);

			if(status=="Completed"||status=='Verifying'||status=="Failed")
				$("#controls",div).css('display','none');

			$("#status",div).text(status);
			$("#percent",div).text(progress.toString()+"%");
			$('#size',div).text('Size : '+(fileSize/(1024*1024)).toFixed(2)+' MB');
		}
		function createDiv(fileName,fileSize,percent,status,hidden)
		{
			index=elements.length;
			var e=getProgressBar(percent,status);
			if(status=='Verifying'||status=='Restarting')
				e.removeAttr('value');
			var span=$('<span id="size">Size : '+(fileSize/(1024*1024)).toFixed(2)+' MB	</span><span id="percent">'+percent.toString()+'%</span><span id="status">'+status+'</span>');
			
			

			var controls=$('<span id="controls"></span>');
			if(status=="Downloading"||status=="Paused")
			{
				if(status=="Paused")
					text="resume";
				else
					text="pause";

				controls.append(function(){	return $('<a href="'+index+'" class="pause">'+text+'</a>').click(pause_handler);	});
			}

			var div=$('<div id="download"><span id="fileName">'+fileName+'</span></div>');
			if(hidden)
				div.css('display','none');
			div.append(controls).append(e).append(span);
			$("#body").append(div);
			elements.push(div);
		}
		function clearView()
		{
			count=0;
			for(i=0;i<lastLength;i++)
			{
				if(objects[i].clear)
				{
					removeDiv(i);
					continue;
				}
				count++;
			}
			$('#count').html(count+"\tDownloads");
		}
		function updateView()
		{
			var count=0;
			for(i=0;i<lastLength;i++)
			{
				if(objects[i].clear)
					continue;
				count++;
				updateDiv(i,objects[i].status,objects[i].percent,objects[i].size);
			}
			for(i=lastLength;i<objects.length;i++)
			{
				createDiv(objects[i].fileName,objects[i].size,objects[i].percent,objects[i].status,objects[i].clear);
				if(!objects[i].clear)
					continue;
				count++;
			}
			lastLength=objects.length;
			$('#count').html(count+"\tDownloads");
		}
		function init()
		{
			backgroundView=chrome.extension.getBackgroundPage();
			objects=backgroundView.objects;
			var count=0;
			for(i=0;i<objects.length;i++)
			{
				createDiv(objects[i].fileName,objects[i].size,objects[i].percent,objects[i].status,objects[i].clear);
				if(objects[i].clear)
					continue;
				count++;
			}
			$(".meter > span").each(function() {
				$(this)
					.data("origWidth", $(this).width())
					.width(0)
					.animate({
						width: $(this).data("origWidth")
					}, 900);
			});

			lastLength=objects.length;
			$('#count').html(count+"\tDownloads");
		}
		$('a.close').click(function(){window.close();});
		$('a.clear').click(function()
		{
			localStorage.removeItem(DOWNLOADS_KEY);
			for(i=0;i<objects.length;i++)
				if(objects[i].status=='Completed')
					objects[i].clear=true;
			clearView();
			return false;
		});		
		init();
		setInterval(updateView,1000);
 	}
);
