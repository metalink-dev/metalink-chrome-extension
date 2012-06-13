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
$(document).ready
(
	function()
	{
		function updateDiv(index,status,progress,fileSize)
		{
			div=elements[index];
			if(status=='Verifying'||status=='Restarting')
				$("progress",div).removeAttr('value');
			else
				$("progress",div).attr('value',progress);
			$("#status",div).text(status);
			$("#percent",div).text(progress+"%");
			$('#size',div).text('Size : '+(fileSize/(1024*1024)).toFixed(2)+' MB');
		}
		function createDiv(fileName,fileSize,percent,status)
		{
			var e=$('<progress max="100" value="'+percent+'"></progress>');
			if(status=='Verifying'||status=='Restarting')
				e.removeAttr('value');
			var span=$('<span id="size">Size : '+(fileSize/(1024*1024)).toFixed(2)+' MB	</span><span id="percent">'+percent+'%</span><span id="status">'+status+'</span>');
			var div=$('<div id="download">'+fileName+'</div>');
			div.append(e).append(span);
			$("#body").append(div);
			elements.push(div);
		}
		function updateView()
		{
			for(i=0;i<lastLength;i++)
				updateDiv(i,objects[i].status,objects[i].percent,objects[i].size);
			for(i=lastLength;i<objects.length;i++)
				createDiv(objects[i].fileName,objects[i].size,objects[i].percent,objects[i].status);
			lastLength=objects.length;
			$('#count').html(lastLength+"\tDownloads");
		}
		function init()
		{
			backgroundView=chrome.extension.getBackgroundPage();
			objects=backgroundView.objects;
			console.log(objects.length);
			for(i=0;i<objects.length;i++)
				createDiv(objects[i].fileName,objects[i].size,objects[i].percent,objects[i].status);
			lastLength=objects.length;
			$('#count').html(lastLength+"\tDownloads");
		}
		$('a.close').click(function(){window.close();});
		

		init();
		setInterval(updateView,100);
 	}
);
