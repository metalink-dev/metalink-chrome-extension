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
			if(status=='Verifying')
				$("progress",div).removeAttr('value');
			else
				$("progress",div).attr('value',progress);
			$("#status",div).text(status);
			$("#percent",div).text(progress+" %");
			$('#size',div).text('Size : '+(fileSize/(1024*1024)).toFixed(2)+' MB');
		}
		function createDiv(fileName,fileSize,percent,status)
		{
			var e=$('<progress max="100" value="'+percent+'"></progress>');
			if(status=='Verifying')
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
