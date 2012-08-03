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


const DOWNLOADS_KEY		="PREVIOUS_DOWNLOADS";
const PAUSED_DOWNLOADS_KEY	="PAUSED_DOWNLOADS";
const MBSIZE 			=1/((1024)*(1024));
const FILENAME_LENGTH 		= 25;
const SPEED_SPAN_TAG		='speed';
const HYPEN_TAG			='hypen';
const DOWNLOADED_SIZE_SPAN	='downloadedSize';
const OF_TAG			='of_span';
const FILESIZE_TAG		='fileSize';
const PERCENT_TAG		='percent';
const STATUS_TAG		='status';
const INFO_TAG			='info';
const LEFT_INFO_TAG		='left_info';


$(document).ready
(
	function()
	{
		function hideSpan(temp,flag)
		{
			if(flag)
				temp.css('display','none');
			else
				temp.show();
		}
		function getSpan(temp)
		{
			var e=$('<span id="'+temp+'"></span>');
			return e;
		}
		function getSpanWithContent(temp,content)
		{
			var e=$('<span id="'+temp+'">'+content+'</span>');
			return e;
		}
		function getFilesizeContent(filesize)
		{
			temp=filesize*MBSIZE;
			return (temp<1024)?(temp.toFixed(1)+' MB'):((temp/1024).toFixed(1)+' GB');
		}
		function getSpeedContent(speed)
		{
			return (speed<1024)?(speed.toFixed()+' KB/s'):((speed/1024).toFixed()+' MB/s');
		}
		function getProgressContent(progress)
		{
			return (progress.toFixed()+'%');
		}
		function updateStatus(div,status)
		{
			temp=$('#'+STATUS_TAG,div);
			if(temp.text()!=status)
				temp.text(status);
		}
		/*
		function updateStatusAndHide(div,status)
		{
			//
			//
		}
		function updateStatusAndShow(div,status)
		{
			hideSpan($('#'+LEFT_INFO_TAG,div),false);
			updateStatus(div,status);
		}
		*/
		function getStatusInfo(downloadedSize,fileSize,percent,speed,status)
		{
			var statusSpan		=getSpanWithContent(STATUS_TAG,	status);

			if(status=="Completed")
				return getSpan(INFO_TAG).append(statusSpan);
			
			var left_info		=getSpan(LEFT_INFO_TAG);
			var speedSpan		=getSpanWithContent(SPEED_SPAN_TAG,getSpeedContent(speed));
			var hypen1		=getSpanWithContent(HYPEN_TAG,' - ');
			var hypen2		=getSpanWithContent(HYPEN_TAG,' - ');
			var downloadedSizeSpan	=getSpanWithContent(DOWNLOADED_SIZE_SPAN,getFilesizeContent(downloadedSize));
			var ofSpan		=getSpanWithContent(OF_TAG,' of ');
			var fileSizeSpan	=getSpanWithContent(FILESIZE_TAG,getFilesizeContent(fileSize));
			var percentSpan		=getSpanWithContent(PERCENT_TAG,getProgressContent(percent));

			left_info.append(speedSpan).append(hypen1).append(downloadedSizeSpan).append(ofSpan).append(fileSizeSpan).append(hypen2).append(percentSpan);
			return getSpan(INFO_TAG).append(left_info).append(statusSpan);
		}
		function handleControlUpdate(div,status)
		{
			if(status=="Completed"||status=="Verifying"||status=="Waiting"||status=="Failed")
			{
				if($("#controls",div).css('display')!='none')
					$("#controls",div).css('display','none');
			}
			else
			{
				if($("#controls",div).css('display')=='none')
					$("#controls",div).show();
			}
		}
		function getProgressBar(percent,status)
		{
			var spanElement=$('<span style="width: '+percent+'%" id="progressbarspan"><span></span></span>');
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
				case 'Cancelled':
					divContainer=$('<div class="meter nostripes red" id="progressbardiv"></div>');
					divContainer.append(spanElement);
					return divContainer;
				case 'Waiting':
					divContainer=$('<div class="meter nostripes blue" id="progressbardiv"></div>');
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
				case 'Cancelled':
					$("#progressbardiv",div).attr('class','meter nostripes red');
					return;
				case 'Waiting':
					$("#progressbardiv",div).attr('class','meter nostripes blue');
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
		function cancel_handler()
		{
			if($(this).text()=="cancel")
			{
				$(this).text("retry");
				div=elements[parseInt($(this).attr('href'))];
				hideSpan($('#pause',div),true);
				hideSpan($('#'+LEFT_INFO_TAG,div),true);
				$('#status',div).text('Cancelled');
				chrome.extension.sendRequest({data: parseInt($(this).attr('href')), cmd:"CANCEL"});
				return false;
			}
			$(this).text("cancel");
			chrome.extension.sendRequest({data: parseInt($(this).attr('href')), cmd:"RETRY"});
			div=elements[parseInt($(this).attr('href'))];
			hideSpan($('#pause',div),false);
			hideSpan($('#'+LEFT_INFO_TAG,div),false);
			$('#status',div).text('Downloading');
			$("#info",div).css('display','inline');
			return false;
		}
		function removeDiv(index)
		{
			div=elements[index];
			div.hide('slow');
		}
		function updateDiv(index,status, downloadedSize, progress, speed, fileSize)
		{
			div=elements[index];
			updateProgressBar(index,progress,status);
			handleControlUpdate(div,status);


			$("#downloadedSize",div).text(getFilesizeContent(downloadedSize));
			$("#percent",div).text(getProgressContent(progress));
			$('#'+SPEED_SPAN_TAG,div).text(getSpeedContent(speed));
			updateStatus(div,status);
		}
		function createDiv(fileName, downloadedSize, fileSize, percent, status, speed, hidden)
		{
			fileName=fileName.slice(0,Math.min(fileName.length,FILENAME_LENGTH));
			index=elements.length;
			var e=getProgressBar(percent,status);
			var span=getStatusInfo(downloadedSize,fileSize,percent,speed,status);
			

			var controls=$('<span id="controls"></span>');
			if(status=="Downloading"||status=="Paused"||status=="Cancelled")
			{
				if(status=="Paused")
					text="resume";
				else
					text="pause";
				
				if(status=="Cancelled")
					cancelText="retry";
				else
					cancelText="cancel";
				var pauseSpan=getSpan('pause').append(function(){	return $('<a href="'+index+'">'+text+'</a>').click(pause_handler);});;
				var cancelSpan=getSpan('cancel').append(function(){	return $('<a href="'+index+'">'+cancelText+'</a>').click(cancel_handler);});;
				if(status=="Cancelled"||status=="Waiting")
					hideSpan(pauseSpan,true);
				controls.append(cancelSpan).append(pauseSpan);
			}
			if(status=="Cancelled")
				hideSpan(span,true);
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
			for(var i=0;i<lastLength;i++)
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
			for(var i=0;i<lastLength;i++)
			{
				if(objects[i].clear)
					continue;
				count++;
				updateDiv(i,objects[i].status,objects[i].downloadedSize, objects[i].percent,objects[i].speed, objects[i].size);
			}
			for(var i=lastLength;i<objects.length;i++)
			{
				createDiv(objects[i].fileName,objects[i].downloadedSize, objects[i].size,objects[i].percent,objects[i].status,objects[i].speed, objects[i].clear);
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
			for(var i=0;i<objects.length;i++)
			{
				createDiv(objects[i].fileName,objects[i].downloadedSize, objects[i].size,objects[i].percent,objects[i].status,objects[i].speed, objects[i].clear);
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
				if(objects[i].status=='Completed'||objects[i].status=="Cancelled"||objects[i].status=="Failed")
					objects[i].clear=true;

			items=JSON.parse(localStorage.getItem(PAUSED_DOWNLOADS_KEY));
			if(items!=undefined)
				for(i=0;i<items.length;i++)
					if(items[i])
						if(items[i].status=="Cancelled")
							delete items[i];
			localStorage.setItem(PAUSED_DOWNLOADS_KEY,JSON.stringify(items));
			clearView();
			return false;
		});
		$('a.options').click(function()
		{
			optionsURL=chrome.extension.getURL('options.html');
			window.open(optionsURL);
		});
		init();
		setInterval(updateView,1000);
 	}
);
