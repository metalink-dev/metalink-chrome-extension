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

importScripts('SHA1.js', 'SHA256.js', 'MD5.js');

self.requestFileSystemSync = self.webkitRequestFileSystemSync || self.requestFileSystemSync;
self.BlobBuilder = self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder;

var currentURL=0;
function failedState()
{
	self.postMessage({'cmd':'FAILED'});
	self.close();
}
function saveCommand(url)
{
	self.postMessage({'cmd':'SAVE', 'value':url});
}
function completeCommand()
{
	self.postMessage({'cmd':'COMPLETE'});
	self.close();
}
function restartState()
{
	self.postMessage({'cmd':'RESTART'});
}
function logMessage(msg)
{
	self.postMessage({'cmd':'LOG', 'value':msg});
}
function updateProgress(completed)
{
	self.postMessage({'cmd':'DOWNLOADING', 'value':completed});
}
function updateSize(size)
{
	self.postMessage({'cmd':'SIZE', 'value':size});
}
function verification()
{
	self.postMessage({'cmd':'VERIFICATION'});
}
function deleteFile(fileName,fileSize)
{
	try
	{
		var fs = requestFileSystemSync(TEMPORARY, fileSize);
		var fileEntry = fs.root.getFile(fileName, {create: false});
		fileEntry.remove();
	}catch(e){	logMessage('The file Does not Exist in Temporary Directory');	}
}
function saveFile(contents, fileName, fileSize)
{
	try
	{
		var fs = requestFileSystemSync(TEMPORARY, fileSize+100);
		var fileEntry = fs.root.getFile(fileName, {create: true});
		var bb = new BlobBuilder();
		bb.append(contents);
		try
		{
			fileEntry.createWriter().write(bb.getBlob());
			return fileEntry.toURL();
		}
		catch (e){	logMessage('Error in the FileSystem');	}

	}
	catch (e){	logMessage('Error in the FileSystem');	}
}
function getURL(urls,required)
{
	count=0;
	for(i=0;i<urls.length;i++)
		if(urls[i].substring(0,4)=="http")
		{
			if(count==required)	return urls[i];
			count++;
		}
	return -1;
}
function downloadFile(file)
{
	updateProgress(0);
	url=getURL(file.urls,currentURL);
	if(url==-1)
		failedState("Download Failed");
	try
	{
		var percentComplete=0;
		var xhr = new XMLHttpRequest();
		xhr.open('GET', url, true);
		xhr.responseType = 'arraybuffer';
		xhr.onload	= function(e)
		{
			logMessage("Downloading Complete");
			verification();
			var buffer = new Uint8Array(this.response);
			var computedHash;
			if(file.size!=null)
				if(file.size!=buffer.length)
				{
					logMessage('Verification Failed. Size Mismatch Error. Restarting download from another URL');
					currentURL+=1;
					restartState();
					downloadFile(file);
					return;
				}

			switch(file.hash_type)
			{
				case 'sha1':	computedHash=SHA1(buffer);break;
				case 'sha-1':	computedHash=SHA1(buffer);break;
				case 'sha256':	computedHash=SHA256(buffer);break;
				case 'sha-256':	computedHash=SHA256(buffer);break;
				case 'md5':	computedHash=MD5(buffer);break;
				case 'md-5':	computedHash=MD5(buffer);break;
				default:	computedHash=null;
			};
			if(file.hash_type)
			{
				//logMessage(file.hash);
				//logMessage(computedHash);
				if(computedHash==file.hash)
					logMessage('Verification Successful');
				else
				{
					logMessage('Verification Failed. Restarting download from another URL');
					currentURL+=1;
					restartState();
					downloadFile(file);
					return;
				}
			}
			else
				logMessage('Verification Successful');
			deleteFile(file.fileName,file.size);
			fileSystemURL=saveFile(xhr.response,file.fileName,file.size);
			saveCommand(fileSystemURL);
			completeCommand();
		};
		xhr.onprogress	=function(evt)
		{
			if(evt.lengthComputable)
			{
				temp=(evt.loaded / evt.total)*100;
				if(temp-percentComplete>1)
				{
					updateProgress(temp);
					percentComplete=temp;
				}
			}
			if(file.size==null)
			{	
				updateSize(evt.total);
				file.size=evt.total;
			}
		};
		xhr.onerror	=function(evt)
		{
			logMessage('Download failed from '+url);
			logMessage('Failing back to the next Mirror');
			currentURL++;
			downloadFile(file);
			return;
		}
		xhr.send();
	}
	catch(e) 
	{
		return "XHR Error " + e.toString();
	}
}
self.addEventListener('message', 
	function(e) 	{
		var data = e.data;
		switch (data.cmd)
		{
			case 'start':
				file=JSON.parse(data.url);
				downloadFile(file);
				break;
		};
	},
false);
