window.addEventListener("DOMContentLoaded", init);
var checkboxValues = 
{
	metalinkSaveAsEnabled: "metalinkSaveAsEnabled"
};
function getFromLocalStorage(option)
{
	//console.log(option);
	//console.log(localStorage[option]);
	if(localStorage[option]==undefined||localStorage[option]=="false")
		return false;
	return true;
}
function saveToLocalStorage(option,value)
{
	localStorage[option]=value;
}
function init() 
{
	for (var i in checkboxValues) 
	{
		var el = document.getElementById(i);
		el.checked = getFromLocalStorage(checkboxValues[i]);
		el.addEventListener("change", checkboxChanged);
	}
}
function checkboxChanged(e) 
{
	var optionName = checkboxValues[this.id];
	if (optionName) 
		saveToLocalStorage(optionName, this.checked);
	//console.log(localStorage[optionName]);
}
