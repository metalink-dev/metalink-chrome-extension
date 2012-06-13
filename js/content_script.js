function checkMetalink()
{
	link=$(this).get(0).href;
	var meta4=(link.substr(link.length-6)==".meta4");
	var metalink=(link.substr(link.length-9)==".metalink");
	if(meta4||metalink)
	{
		chrome.extension.sendRequest({url: link});
		return false;
	}
	return true;
}
$("a").click(checkMetalink);
