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
	var fs = requestFileSystemSync(TEMPORARY, fileSize);
	try
	{
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
			switch(file.hash_type)
			{
				case 'sha1':	computedHash=SHA1(buffer);break;
				case 'sha256':	computedHash=SHA256(buffer);break;
				case 'md5':	computedHash=MD5(buffer);break;
				default:	computedHash=null;
			};
			if(file.hash_type)
			{
				if(computedHash==file.hash)
					logMessage('Verification Successful');
				else
				{
					logMessage('Verification Failed. Restarting download from another URL');
					currentURL+=1;
					downloadFile(file);
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
