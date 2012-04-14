//	Metalink Downloader-Chrome Extension
//	Copyright (C) 2012  
//	Devloped by :	Sundaram Ananthanarayanan

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

var req = new XMLHttpRequest();
var xhr = new XMLHttpRequest();
var allLinks = [];
var visibleLinks = [];
var fileContents = "";
var filesize = -1;
var readByteAt = function(i)
{
	var temp=fileContents.charCodeAt(i) & 0xff;
	//return (temp<128)?temp:temp-256;
	return temp;
};
function SHA1 (start,size)
{ 
	function rotate_left(n,s) 
	{
		var t4 = ( n<<s ) | (n>>>(32-s));
		return t4;
	};
 
	function lsb_hex(val)
	{
		var str="";
		var i;
		var vh;
		var vl;
 
		for( i=0; i<=6; i+=2 )
		{
			vh = (val>>>(i*4+4))&0x0f;
			vl = (val>>>(i*4))&0x0f;
			str += vh.toString(16) + vl.toString(16);
		}
		return str;
	};
 
	function cvt_hex(val)
	{
		var str="";
		var i;
		var v;
 
		for( i=7; i>=0; i-- )
		{
			v = (val>>>(i*4))&0x0f;
			str += v.toString(16);
		}
		return str;
	};
	var blockstart;
	var i, j;
	var W = new Array(80);
	var H0 = 0x67452301;
	var H1 = 0xEFCDAB89;
	var H2 = 0x98BADCFE;
	var H3 = 0x10325476;
	var H4 = 0xC3D2E1F0;
	var A, B, C, D, E;
	var temp;
 
	var msg_len = size;
 
	var word_array = new Array();
	for( i=start; i<start+msg_len-3; i+=4 ) {
		j = readByteAt(i)<<24 | readByteAt(i+1)<<16 |
		readByteAt(i+2)<<8 | readByteAt(i+3);
		word_array.push( j );
	}
 
	switch( msg_len % 4 ) {
		case 0:
			i = 0x080000000;
		break;
		case 1:
			i = readByteAt(start+msg_len-1)<<24 | 0x0800000;
		break;
 
		case 2:
			i = readByteAt(start+msg_len-2)<<24 | readByteAt(start+msg_len-1)<<16 | 0x08000;
		break;
 
		case 3:
			i = readByteAt(start+msg_len-3)<<24 | readByteAt(start+msg_len-2)<<16 | readByteAt(start+msg_len-1)<<8	| 0x80;
		break;
	}
 
	word_array.push( i );
 
	while( (word_array.length % 16) != 14 ) word_array.push( 0 );
 
	word_array.push( msg_len>>>29 );
	word_array.push( (msg_len<<3)&0x0ffffffff );
 
 
	for ( blockstart=0; blockstart<word_array.length; blockstart+=16 ) {
 
		for( i=0; i<16; i++ ) W[i] = word_array[blockstart+i];
		for( i=16; i<=79; i++ ) W[i] = rotate_left(W[i-3] ^ W[i-8] ^ W[i-14] ^ W[i-16], 1);
 
		A = H0;
		B = H1;
		C = H2;
		D = H3;
		E = H4;
 
		for( i= 0; i<=19; i++ ) {
			temp = (rotate_left(A,5) + ((B&C) | (~B&D)) + E + W[i] + 0x5A827999) & 0x0ffffffff;
			E = D;
			D = C;
			C = rotate_left(B,30);
			B = A;
			A = temp;
		}
 
		for( i=20; i<=39; i++ ) {
			temp = (rotate_left(A,5) + (B ^ C ^ D) + E + W[i] + 0x6ED9EBA1) & 0x0ffffffff;
			E = D;
			D = C;
			C = rotate_left(B,30);
			B = A;
			A = temp;
		}
 
		for( i=40; i<=59; i++ ) {
			temp = (rotate_left(A,5) + ((B&C) | (B&D) | (C&D)) + E + W[i] + 0x8F1BBCDC) & 0x0ffffffff;
			E = D;
			D = C;
			C = rotate_left(B,30);
			B = A;
			A = temp;
		}
 
		for( i=60; i<=79; i++ ) {
			temp = (rotate_left(A,5) + (B ^ C ^ D) + E + W[i] + 0xCA62C1D6) & 0x0ffffffff;
			E = D;
			D = C;
			C = rotate_left(B,30);
			B = A;
			A = temp;
		}
 
		H0 = (H0 + A) & 0x0ffffffff;
		H1 = (H1 + B) & 0x0ffffffff;
		H2 = (H2 + C) & 0x0ffffffff;
		H3 = (H3 + D) & 0x0ffffffff;
		H4 = (H4 + E) & 0x0ffffffff;
 
	}
 
	var temp = cvt_hex(H0) + cvt_hex(H1) + cvt_hex(H2) + cvt_hex(H3) + cvt_hex(H4);
 
	return temp.toLowerCase(); 
}
function showLinks() 
{
	var linksTable = document.getElementById('links');
	while (linksTable.children.length > 1) 
	{
		linksTable.removeChild(linksTable.children[linksTable.children.length - 1])
	}
	for (var i = 0; i < visibleLinks.length; ++i) 
	{
		var row = document.createElement('tr');
		var col0 = document.createElement('td');
		var col1 = document.createElement('td');
		var checkbox = document.createElement('input');
		checkbox.checked = true;
		checkbox.type = 'checkbox';
		checkbox.id = 'check' + i;
		col0.appendChild(checkbox);
		col1.innerText = visibleLinks[i];
		col1.style.whiteSpace = 'nowrap';
		col1.onclick = function() 
		{
			checkbox.checked = !checkbox.checked;
		}
		row.appendChild(col0);
		row.appendChild(col1);
		linksTable.appendChild(row);
	}
}

function toggleAll() 
{
	var checked = document.getElementById('toggle_all').checked;
  	for (var i = 0; i < visibleLinks.length; ++i) 
	{
    		document.getElementById('check' + i).checked = checked;
  	}
}
function min(a,b)
{
	return a>b?b:a;
}
function processData()
{
	var result="";
	var sharesults=new Array();
	start=0;
	size=req.responseXML.getElementsByTagName("size")[0].firstChild.nodeValue;
	console.log(req.responseXML.getElementsByTagName("pieces")[0].getAttribute("length"));
	var packetSize=req.responseXML.getElementsByTagName("pieces")[0].getAttribute("length");
	while(size>0)
	{
		psize=min(packetSize,size);
		result=SHA1(start,psize);
		sharesults.push(result);
		start+=packetSize;
		size-=packetSize;
	}
	return sharesults;
}
function getPieces()
{
	var x = req.responseXML.getElementsByTagName("pieces");
	var pieces=new Array();
	for(i=0;i<(x[0].childNodes.length-1)/2;i++)
	{
		var k=x[0].childNodes[i*2+1].firstChild.nodeValue;
		pieces.push(k);
	}
	return pieces;
}
function compareResults(a,b)
{
	if(a.length!=b.length)
		return false;
	for(i=0;i<a.length;i++)
	{
		console.log(a[i]);
		if(a[i]!=b[i])
			return false;
	}
	return true;
}
function parseXML()
{
	var x = req.responseXML.getElementsByTagName("resources");
	for(i=0;i<(x[0].childNodes.length-1)/2;i++)
	{
		var k=x[0].childNodes[i*2+1].firstChild.nodeValue;
		console.log(k);
		chrome.experimental.downloads.download({url: k,saveAs:true},function(id) {});
	}
}
function downloadCheckedLinks() 
{
	for (var i = 0; i < visibleLinks.length; ++i) 
	{
	    	if (document.getElementById('check' + i).checked) 
		{
			req.open("GET",visibleLinks[i],true);
			req.onload = parseXML;
			req.send(null);
		}
	}
}


function filterLinks() 
{
	var filterValue = document.getElementById('filter').value;
	if (document.getElementById('regex').checked) 
	{
		visibleLinks = allLinks.filter(function(link) {return link.match(filterValue);});
  	} 
	else 
	{
		var terms = filterValue.split(' ');
		visibleLinks = allLinks.filter(function(link) 
		{
			for (var termI = 0; termI < terms.length; ++termI) 
			{
				var term = terms[termI];
				if (term.length != 0) 
				{
			  		var expected = (term[0] != '-');
			  		if (!expected) 
					{
			    			term = term.substr(1);
			    			if (term.length == 0) 
						{
			      				continue;
			    			}
			  		}
			  		var found = (-1 !== link.indexOf(term));
			  		if (found != expected) 
					{
			    			return false;
			  		}
				}
	      		}
	      		return true;
	    	});
  	}
  	showLinks();
}

chrome.extension.onRequest.addListener(function(links) 
{
  	for (var index in links) 
	{
    		allLinks.push(links[index]);
  	}
	allLinks.sort();
	visibleLinks = allLinks;
	showLinks();
});


window.onload = function() 
{
	document.getElementById('regex').onchange = filterLinks;
  	document.getElementById('filter').onkeyup = filterLinks;
  	document.getElementById('toggle_all').onchange = toggleAll;
  	document.getElementById('download_0').onclick = downloadCheckedLinks;
  	//document.getElementById('download_1').onclick = downloadCheckedLinks;

	chrome.windows.getCurrent(function (currentWindow) 
	{
		chrome.tabs.query({active: true, windowId: currentWindow.id},function(activeTabs) 
		{
	      		chrome.tabs.executeScript(
			activeTabs[0].id, {file: 'send_links.js', allFrames: true});
	    	});
	});
};
