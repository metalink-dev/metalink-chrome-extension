<!--
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
-->
var req2 = new XMLHttpRequest();
req2.overrideMimeType('text/xml');
var xhr2 = new XMLHttpRequest();
function parseXML2()
{
	var xml=req2.responseXML;
	//console.log(xml);
	if(fileName.substr(fileName.length-6)=='.meta4')
	{
		var x = xml.getElementsByTagName("file");
		for(j=0;j<x.length;j++)
		{
			for(i=0;i<(x[j].childNodes.length-1)/2;i++)
			{
				var v=x[j].childNodes[i*2+1];
				if(v.localName=="url")
				{
					r=v.firstChild.nodeValue;
					console.log(r);
					chrome.experimental.downloads.download({url: r,saveAs:true},function(id) {});
					break;
				}
			}
		}
	}
	else
	{
		var x = xml.getElementsByTagName("resources");
		for(j=0;j<x.length;j++)
		{
			for(i=0;i<(x[j].childNodes.length-1)/2;i++)
			{
				var v=x[j].childNodes[i*2+1];
				if(v.localName=="url")
				{
					var k=v.firstChild.nodeValue;
					console.log(k);
					chrome.experimental.downloads.download({url: k,saveAs:true},function(id) {});
					break;
				}
			}
		}
	}
}
chrome.webRequest.onBeforeRequest.addListener
(
	function(info) 
	{
		fileName=info.url;
		req2.open("GET",info.url,true);
		req2.onload = parseXML2;
		req2.send(null);
		//chrome.tabs.reload(info.tabId);
		//return {cancel: true};
	},
	// filters
	{
    		urls: ["http://*/*.metalink","http://*/*.meta4"]
	},
  	// extraInfoSpec
  	["blocking"]
);
