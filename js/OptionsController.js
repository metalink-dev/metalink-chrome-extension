window.addEventListener("DOMContentLoaded", init);
var checkboxValues = 
{
        metalinkSaveAsEnabled: "metalinkSaveAsEnabled"
};
 var selectValues = 
{
    metalinkDownloadsPerServer	: "metalinkDownloadsPerServer",
    metalinkConcurrentDownloads	: "metalinkConcurrentDownloads",
    metalinkChunkSize		: "metalinkChunkSize"
};
function getFromLocalStorage(option)
{
        if(localStorage[option]==undefined||localStorage[option]=="false")
                return false;
        return true;
}
function getDataFromLocalStorage(option)
{
	if(localStorage[option]==undefined)
                return 1;
	return localStorage[option];
}
function saveToLocalStorage(option,value)
{
	console.log(option);
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
	for (var i in selectValues) 
	{
      		var el = document.getElementById(i);
      		var intendedValue = getDataFromLocalStorage(selectValues[i]);
      		for (var i = 0; i < el.options.length; i++) 
		{
        		if (el.options[i].value == intendedValue) {
          		el.selectedIndex = i;
          		break;
        		}
		}
		el.addEventListener("change", selectChanged);
      	}
}
function checkboxChanged(e) 
{
        var optionName = checkboxValues[this.id];
        if (optionName)
                saveToLocalStorage(optionName, this.checked);
        //console.log(localStorage[optionName]);
}
function selectChanged(e)
{
	var optionName = selectValues[this.id];
        if (optionName)
                saveToLocalStorage(optionName, this.value);
	
	//console.log(this.value);
}
