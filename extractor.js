function displayParameters(files)
{
	for(i=0;i<files.length;i++)
	{
		var file=files[i];
		console.log(file.size);
		console.log(files[i].fileName);
		for(k=0;k<files[i].urls.length;k++)
			console.log(files[i].urls[k]);
		console.log(file.hash_type);
		console.log(file.hash);
		console.log(file.piece_type);
		console.log(file.piece_length);
		for(k=0;k<files[i].pieces.length;k++)
			console.log(files[i].pieces[k]);
	}
}
function extractContents(contents, type)
{
	var files=new Array();
	if(type=="metalink")
	{
		var x = contents.getElementsByTagName("file");
		for(j=0;j<x.length;j++)
		{
			var file=new Object();
			file.fileName=x[j].getAttribute("name");
			var urls=[];
			for(i=0;i<(x[j].childNodes.length-1)/2;i++)
			{
				var v=x[j].childNodes[i*2+1];
				if(v.localName=="size")
					file.size=v.firstChild.nodeValue;
				if(v.localName=="resources")
					for(k=1;k<v.childNodes.length;k+=2)
						urls.push(v.childNodes[k].firstChild.nodeValue);
				if(v.localName=="verification")
					for(k=1;k<v.childNodes.length;k+=2)
					{
						if(v.childNodes[k].localName=="hash")
						{
							file.hash_type	=v.childNodes[k].getAttribute("type");
							file.hash	=v.childNodes[k].firstChild.nodeValue;
						}
						if(v.childNodes[k].localName=="pieces")
						{
							file.piece_type		=v.childNodes[k].getAttribute("type");
							file.piece_length	=v.childNodes[k].getAttribute("length");
							pieces=[];
							var hashes=v.childNodes[k];
							for(l=1;l<hashes.childNodes.length;l+=2)
								pieces.push(hashes.childNodes[l].firstChild.nodeValue);
							file.pieces=pieces;
						}
					}
			}
			file.urls=urls;
			files.push(file);
		}
	}
	else
	if(type=="meta4")
	{
		var x = contents.getElementsByTagName("file");
		for(j=0;j<x.length;j++)
		{
			var file=new Object();
			file.fileName=x[j].getAttribute("name");
			var urls=[];
			for(i=0;i<(x[j].childNodes.length-1)/2;i++)
			{
				var v=x[j].childNodes[i*2+1];
				if(v.localName=="size")
					file.size=v.firstChild.nodeValue;
				if(v.localName=="url")
					urls.push(v.firstChild.nodeValue);
				if(v.localName=="hash")
				{
					file.hash_type	=v.getAttribute("type");
					file.hash	=v.firstChild.nodeValue;
				}
				if(v.localName=="pieces")
				{
					file.piece_type		=v.getAttribute("type");
					file.piece_length	=v.getAttribute("length");
					pieces=[];
					var hashes=v;
					for(l=1;l<hashes.childNodes.length;l+=2)
						pieces.push(hashes.childNodes[l].firstChild.nodeValue);
					file.pieces=pieces;
				}
			}
			file.urls=urls;
			files.push(file);
		}
	}
	return files;
}

