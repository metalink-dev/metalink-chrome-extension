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

var links = [].slice.apply(document.getElementsByTagName('a'));
links = links.map(function(element) 
{
	var href = element.href;
	var hashIndex = href.indexOf('#');
	if (hashIndex >= 0) {
		href = href.substr(0, hashIndex);
	}
	return href;
});

links.sort();

var kBadPrefix = 'javascript';
for (var i = 0; i < links.length;) 
{
	if (((i > 0) && (links[i] == links[i - 1])) ||(links[i] == '') ||(kBadPrefix == links[i].toLowerCase().substr(0, kBadPrefix.length))|| (links[i].substr(links[i].length-8)!='metalink'))
	{
		links.splice(i, 1);
	}
	else 
	{
		++i;
	}
}
chrome.extension.sendRequest(links);
