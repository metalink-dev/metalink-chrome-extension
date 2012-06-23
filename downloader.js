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
var packetSize=1024*1024;
var fileSize,numThreads=1,divisions;
var numberOfPackets,numberOfPacketsToBeDownloaded,finishedBytes=0,fraction;

var fileEntry,fileWriter;
var progress=new Array();
var xhrs = [];
var completedPackets=-1;

//var md5, PAUSE_FLAG=false;

function failedState()
{
	self.postMessage({'cmd':'FAILED'});
	self.close();
}
function saveObject(packets)
{
	self.postMessage({'cmd':'PAUSEDSTATE','value':packets});
	delete temp;
}
function saveCommand(url)
{
	self.postMessage({'cmd':'SAVE', 'value':url});
}
function completeCommand()
{
	delete object, progress;
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
		fs = requestFileSystemSync(TEMPORARY, fileSize);
		tempFileEntry = fs.root.getFile(fileName, {create: false});
		tempFileEntry.remove();
	}catch(e){	logMessage('The file Does not Exist in Temporary Directory');	}
}

//this is to be used if the file does not have any saved packets and this is the first time the download is called
function createFileEntry(fileName,fileSize)
{
	deleteFile(fileName,fileSize);
	try
	{
		fs = requestFileSystemSync(TEMPORARY, fileSize);
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
		fs = requestFileSystemSync(TEMPORARY, fileSize);
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
		bb = new BlobBuilder();
		bb.append(contents);
		fileWriter.seek(offset);
		fileWriter.write(bb.getBlob());
		delete bb;
	}
	catch (e)
	{	
		logMessage('Failure to save piece');
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
		fs = requestFileSystemSync(TEMPORARY, fileSize+100);
		fileEntry = fs.root.getFile(fileName, {create: true});
		bb = new BlobBuilder();
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
function init_verify(file)
{
	if(file.hash_type)
	{
		switch(file.hash_type)
		{
			case 'sha1':	md5=new SHA1(file.size);break;
			case 'sha-1':	md5=new SHA1(file.size);break;
			case 'sha256':	md5=new SHA256(file.size);break;
			case 'sha-256':	md5=new SHA256(file.size);break;
			case 'md5':	md5=new MD5(file.size);break;
			case 'md-5':	md5=new MD5(file.size);break;
			default:	md5=null;
		};
	}
	return md5;
}
function verifyFile(file)
{
	verification();
	checker=init_verify(file);

	if(checker)
	{
		packetLength=5*1024*1024;
		f=fileEntry.file();
		reader = new FileReaderSync();

		start=0;end=packetLength;
		while(start<fileSize)
		{
			blob=f.webkitSlice(start, end);
			tempArray=new Uint8Array(reader.readAsArrayBuffer(blob));
			if(end==fileSize)
				checker.update(tempArray,true);
			else
				checker.update(tempArray,false);
			start+=packetLength;
			end=min(fileSize,end+packetLength);
			logMessage(delete tempArray);
		}
		logMessage(checker.getResult());
		if(checker.getResult()==file.hash)
			return true;
		return false;
	}
	return true;
}
function min(a,b)
{
	return (a>b)?b:a;
}
function startDownload()
{
	for(i=0;i<numThreads;i++)
		downloadPiece(file,i,i*divisions,min((i+1)*divisions,numberOfPackets));
}
function getFileSize(address)
{
	if(address==-1)
		failedState();
	client= new XMLHttpRequest();
	client.open("HEAD", address, false);
	client.send();
	if(client.status==200)
		return client.getResponseHeader("Content-Length");
	return -1;
}
function downloadPiece(file,threadID,index,endIndex)
{
	start=index*packetSize;
	end=min((index+1)*packetSize-1,file.size-1);

	progress[threadID]=0;

	if(file.finishedPackets)
		if(file.finishedPackets>index)
		{
			logMessage(index+' packet downloaded');
			finishedBytes+=(end-start+1);

			delete start;delete end;

			if(index+1!=endIndex)
				downloadPiece(file,threadID,index+1,endIndex);
			return;
		}

	logMessage('Downloading packet '+index);
	url=getURL(file.urls,currentURL);
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
		xhrs[threadID].setRequestHeader("Cache-Control", "no-cache");
		xhrs[threadID].onload	= function(e)
		{
			if(xhrs[threadID].status!=200&&xhrs[threadID].status!=206)
			{
				currentURL++;
				downloadPiece(file,threadID,index,endIndex);
				return;
			}

			savePiece(xhrs[threadID].response,file.fileName,file.size,start);
			//numberOfPacketsToBeDownloaded--;

			finishedBytes+=(end-start+1);
			progress[threadID]=0;
			
			/*
			if(md5)
			{
				if(index==numberOfPackets-1)
					lastPacket=true;
				else
					lastPacket=false;
			
				md5.update(new Uint8Array(this.response),lastPacket);
			}
			*/
			completedPackets=index+1;

			delete start;
			delete end;
			delete url;
			delete xhrs[threadID];

			/*
			if(PAUSE_FLAG)
			{
				saveObject(completedPackets);
				self.close();
			}
			*/
			
			if(index+1==numberOfPackets)
			{
				if(!verifyFile(file))
				{
					logMessage('Verification failed');
					currentURL++;

					file.finishedPackets=null;

					init(file);
					startDownload();
					return;
				}
				fileSystemURL=getFileSytemURL(file.fileName,file.size);
				saveCommand(fileSystemURL);
				completeCommand();
				return;
			}
			else
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
function init(file)
{
	fileSize=file.size;
	if(fileSize==null)
	{
		while(true)
		{
			address=getURL(file.urls,currentURL);
			if(address==-1)
				failedState();
			fileSize=getFileSize(address);
			if(fileSize>0)
			{
				file.size=fileSize;
				updateSize(fileSize);
				break;
			}
			currentURL++;
		}
	}

	completedPackets=-1;
	if(file.finishedPackets)
	{
		logMessage('RESUMED');
		getFileEntry(file.fileName,fileSize);
		completedPackets=file.finishedPackets;
	}
	else
		createFileEntry(file.fileName,fileSize);

	fraction=(1/fileSize)*100;
	numberOfPackets=Math.ceil(fileSize/packetSize);
	divisions=Math.ceil(numberOfPackets/numThreads);

	//numberOfPacketsToBeDownloaded=numberOfPackets - completedPackets.length;

	for(i=0;i<numThreads;i++)
		progress[i]=0;

	finishedBytes=0;
}
self.addEventListener('message', 
	function(e) 	{
		var data = e.data;
		switch (data.cmd)
		{
			case 'START':
				file=JSON.parse(data.url);
				init(file);
				

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
