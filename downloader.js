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
var packetSize=512*1024;
var fileSize,numThreads=3,divisions;
var numberOfPackets,numberOfPacketsToBeDownloaded,finishedBytes=0,fraction;

var fileEntry,fileWriter;
var progress=new Array();
var xhrs = [];
var completedPackets=[];


function failedState()
{
	self.postMessage({'cmd':'FAILED'});
	self.close();
}
function saveObject(packets)
{
	self.postMessage({'cmd':'PAUSEDSTATE','value':JSON.stringify(packets)});
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
		var tempFileEntry = fs.root.getFile(fileName, {create: false});
		tempFileEntry.remove();
	}catch(e){	logMessage('The file Does not Exist in Temporary Directory');	}
}

//this is to be used if the file does not have any saved packets and this is the first time the download is called
function createFileEntry(fileName,fileSize)
{
	deleteFile(fileName,fileSize);
	try
	{
		var fs = requestFileSystemSync(TEMPORARY, fileSize);
		fileEntry = fs.root.getFile(fileName, {create: true});
		fileWriter=fileEntry.createWriter();
		fileWriter.truncate(fileSize);
	}
	catch(e)
	{
		logMessage("The File cannot be created");
		failedState();
	}
}

//this is to be used if the download has already started and we expect to resume it.
function getFileEntry(fileName,fileSize)
{
	try
	{
		var fs = requestFileSystemSync(TEMPORARY, fileSize);
		fileEntry = fs.root.getFile(fileName, {create: false});
		fileWriter=fileEntry.createWriter();
	}
	catch(e){logMessage('The file Does not Exist in Temporary Directory');	return -1;}
}


//this assumes that the fileEntry and fileWriter already has been defined.
function savePiece(contents,fileName,fileSize,offset)
{
	try
	{
		var bb = new BlobBuilder();
		bb.append(contents);
		fileWriter.seek(offset);
		fileWriter.write(bb.getBlob());
	}
	catch (e)
	{	
		logMessage(e.toString());
	}
}

function getFileSytemURL(fileName,fileSize)
{
	return fileEntry.toURL();
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
		catch (e){	logMessage('Error in the FileSystem Inner');	}

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
function verifyFile(file)
{
	verification();
	try
	{
		f=fileEntry.file();
		var reader = new FileReaderSync();
		var buffer =new Uint8Array(reader.readAsArrayBuffer(f));
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
		if(computedHash==file.hash)
			return true;
		return false;

	}catch(e)	{logMessage(e.toString());return false;}
}
function min(a,b)
{
	return (a>b)?b:a;
}
function startDownload()
{
	for(var i=0;i<numThreads;i++)
		downloadPiece(file,i,i*divisions,min((i+1)*divisions,numberOfPackets));
}
function downloadPiece(file,threadID,index,endIndex)
{
	var start=index*packetSize;
	var end=min((index+1)*packetSize-1,file.size-1);
	progress[threadID]=0;

	if(file.finishedPackets)
		if(completedPackets.indexOf(index)!=-1)
		{
			logMessage(index+' packet completed');
			finishedBytes+=(end-start+1);
			if(index+1!=endIndex)
				downloadPiece(file,threadID,index+1,endIndex);
			return;
		}

	logMessage('Download packet '+index);
	var url=getURL(file.urls,currentURL);
	if(url==-1)
	{
		failedState();
		return;
	}
	try
	{
		xhrs[threadID] = new XMLHttpRequest();
		xhrs[threadID].open('GET', url, true);
		xhrs[threadID].responseType = 'arraybuffer';
		xhrs[threadID].setRequestHeader("Range", "bytes=" + start + "-" + end);

		xhrs[threadID].onload	= function(e)
		{
			var buffer = new Uint8Array(this.response);
			if(buffer.length!=(end-start+1))
			{
				logMessage('Piece '+index+' Verification Failed. Piece Size Mismatch Error. Restarting download from another URL');
				currentURL+=1;
				restartState();
				downloadPiece(file,threadID,index,endIndex);
				return;
			}
			savePiece(xhrs[threadID].response,file.fileName,file.size,start);
			numberOfPacketsToBeDownloaded--;
			finishedBytes+=(end-start+1);
			progress[threadID]=0;
			completedPackets.push(index);


			if(numberOfPacketsToBeDownloaded==0)
			{
				if(!verifyFile(file))
				{
					currentURL++;
					startDownload();
					return;
				}
				fileSystemURL=getFileSytemURL(file.fileName,file.size);
				saveCommand(fileSystemURL);
				completeCommand();
				return;
			}
			if(index+1!=endIndex)
				downloadPiece(file,threadID,index+1,endIndex);
			return;
		};
		xhrs[threadID].onprogress	=function(evt)
		{
			if(evt.lengthComputable)
				progress[threadID]=evt.loaded;
		};
		xhrs[threadID].onerror	=function(evt)
		{
			logMessage('Download failed from '+url);
			logMessage('Failing back to the next Mirror');
			currentURL++;
			downloadPiece(file,threadID,index,endIndex);
			return;
		}
		xhrs[threadID].send();
	}
	catch(e) 
	{
		return "XHR Error " + e.toString();
	}
}
function sendProgress()
{
	total=finishedBytes;
	for(i=0;i<numThreads;i++)
		total+=progress[i];
	updateProgress(total*fraction);
}
self.addEventListener('message', 
	function(e) 	{
		var data = e.data;
		switch (data.cmd)
		{
			case 'START':
				file=JSON.parse(data.url);
				fileSize=file.size;

				if(file.finishedPackets!=null)
				{
					logMessage('Resumed');
					getFileEntry(file.fileName,fileSize);
					completedPackets=file.finishedPackets;
				}
				else
					createFileEntry(file.fileName,fileSize);


				fraction=(1/fileSize)*100;
				numberOfPackets=Math.ceil(fileSize/packetSize);
				divisions=Math.ceil(numberOfPackets/numThreads);
				
				for(i=0;i<numThreads;i++)
					progress[i]=0;
				
				numberOfPacketsToBeDownloaded=numberOfPackets-completedPackets.length;
				setInterval(sendProgress,1000);
				startDownload();
				break;

			case 'PAUSE':
				logMessage('PAUSED');
				saveObject(completedPackets);
				self.close();
				break;
		};
	},
false);
