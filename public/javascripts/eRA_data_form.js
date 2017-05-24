var sessionId = "";
var contextId = "";
var patientOpened = false;
var contentMap;
var contentArr;
let displayContents = new Set();
let yearsWithEntries = new Set();
let minYearDisplayed = new Date().getFullYear();
let maxYearDisplayed = new Date().getFullYear();
let earliestEntryYear = minYearDisplayed;

/**************************************************************************************************************
*
* Table generation
*
***************************************************************************************************************/

var monthNames = ["Tammikuu", "Helmikuu", "Maaliskuu", "Huhtikuu", "Toukokuu", "Kesäkuu", "Heinäkuu", "Elokuu", "Syyskuu", "Lokakuu", "Marraskuu", "Joulukuu"];
var infoColumns = ["contentDate", "textText", "examText", "diagnosisText", "treatmentText", "medicationText"];
var months;

/**
 * @function makeMonthMap
 * @description Makes a map of months where key is e.g. 02 and month name Helmikuu
 * @returns {monthMap} A map of months
 */
function makeMonthMap() {
	var monthMap = new Map();

	for (var i = 0; i < 12; i++) {
		var number = i + 1;

        if (number < 10) {
            number = "0" + number;
        }

		monthMap.set(number, monthNames[i]);
	}

	return monthMap;
}

/**
 * @function dateTimeToMonthId
 * @description Converts a datetime to a monthId (2017-02)
 * @param {dateTime} Datetime to convert
 * @returns {monthId}
 */
function dateTimeToMonthId(dateTime) {
	var date = new Date(dateTime);
	var month = "";

    if ((date.getMonth() + 1) < 10) {
        month = "0" + (date.getMonth() + 1);
    }
    else {
        month = (date.getMonth() + 1);
    }

	return (date.getFullYear() + "-" + month);
}

/**
 * @function dateTimeToYear
 * @description Converts a datetime to a year
 * @param {dateTime} Datetime to convert
 * @returns {year}
 */
function dateTimeToYear(dateTime) {
	var date = new Date(dateTime);

	return date.getFullYear();
}

/**
 * @function dateTimeToFinDate
 * @description Converts a datetime to a finnish locale date DD.mm.
 * @param {dateTime} Datetime to convert
 * @returns {finDate} e.g. 22.2.
 */
function dateTimeToFinDate(dateTime) {
	var date = new Date(dateTime);

	var finDate = date.getDate() + "." + (date.getMonth() + 1) + ".";

	return finDate;
}

/**
 * @function dateTimeToFinDateTime
 * @description Converts a datetime to a finnish locale date DD.mm.YYYY hh:MM
 * @param {dateTime} Datetime to convert
 * @returns {finDate} e.g. 22.2.2017 12:00
 */
function dateTimeToFinDateTime(dateTime) {
	var date = new Date(dateTime);

	var finDate = date.getDate() + "." + (date.getMonth() + 1) + "." + date.getFullYear();
	finDate += " " + date.getHours() + ":";

    if (date.getMinutes() < 10) {
        finDate += "0" + date.getMinutes();
    }
    else {
        finDate += date.getMinutes();
    }

	return finDate;
}

/**
 * @function generateInfoCell
 * @description Generates a cell of the given class
 * @param {columnClass} The class
 * @returns {cell}
 */
function generateInfoCell(columnClass) {
	var otherClass = "";

	if (columnClass.includes("Date")) {
		otherClass = "date";
	}
	else if (columnClass.includes("Text")) {
		otherClass = "text";
	}

	var cell =  "<td colspan='1' rowspan='1' class='" + columnClass + " " + otherClass + "'></td>";

	return cell;
}

/**
 * @function generateYear
 * @description Generates a year for the table
 * @param {pYear} Year to generate
 * @returns {year} Table rows that make up a year
 */
function generateYear(pYear) {
	if (pYear < minYearDisplayed)
		minYearDisplayed = pYear;

	var oddYear = "";

    if ((pYear % 2) == 1) {
        oddYear = " odd";
    }

	var year = "<tr class='bottomRow" + oddYear + "'>" +
		"<td colspan='1' rowspan='13' id='" + pYear + "' class='year'>" + pYear + "</td>" +
		"</tr>";

	for(var monthKey of months.keys()) {
		year += generateMonth(monthKey, pYear);
	}

	return year;
}

/**
 * @function generateMonth
 * @description Generates a month and adds columns to it
 * @param {monthKey} The key of the month
 * @param {year} The year the month belongs to
 * @returns {month}
 */
function generateMonth(monthKey, year) {
	var monthId = year + "-" + monthKey;
	var month;
	var oddMonth = "";

    if ((parseInt(monthKey) % 2) == 1) {
        oddMonth = " odd";
    }

    if (monthKey == 12) {
        month = "<tr id='" + monthId + "' class='row-0 bottomRow'>";
    }
    else {
        month = "<tr id='" + monthId + "' class='row-0" + oddMonth + "'>";
    }

	month += "<td class='month' colspan='1'>" + months.get(monthKey) + "</td>";

	for(let column of infoColumns) {
		month += generateInfoCell(column);
	}

	month += "</tr>";

	return month;
}

/**
 * @function generateInitialYears
 * @description Generates 3 initial years for the table 
 * @returns {initialYears}
 */
function generateInitialYears() {
	var thisYear = new Date().getFullYear();
	var initialYears;

	for (var i = 2; i >= 0; i--) {
		initialYears += generateYear(thisYear - i);
	}

	// generating 1 future year to make all present years visible
	initialYears += generateYear(thisYear + 1);
	maxYearDisplayed++;

	return initialYears;
}

/**
 * @function generateTableHeaders
 * @description Generates the table headers
 * @returns {headers}
 */
function generateTableHeaders() {
	var headers = "<thead>" +
			"<tr>" +
				"<th colspan='2'></th>" +
				"<th colspan='1'>Pvm</th>" +
				"<th colspan='1'>Merkinnät</th>" +
				"<th colspan='1'>Tutkimukset</th>" +
				"<th colspan='1'>Diagnoosit</th>" +
				"<th colspan='1'>Toimenpiteet</th>" +
				"<th colspan='1'>Lääkitys</th>" +
			"</tr>" +
		"</thead>" +
		"<tbody>" +
		"<tr id='pvmKuvaus' class='bottomRow'>" +
			"</tr>" +
		"</tbody>";
	return headers;
}

/**
 * @function generateTable
 * @description Generates the table and adds it to the container
 * @returns void
 */
function generateTable() {
	$("#dataTable").append(generateTableHeaders());
	$("#pvmKuvaus").after(generateInitialYears());

	shrinkYear(maxYearDisplayed);

	$(".container").addClass("tableGenerated");
}

/**
 * @function init
 * @description Initializes the data structures
 * @returns void
 */
function init() {
	months = makeMonthMap();
	contentMap = new Map();
}

/**
 * @function reInit
 * @description Reinitializes the data structures
 * @returns void
 */
function reInit() {
    contentMap = new Map();
    contentArr = [];
    displayContents = new Set();
    yearsWithEntries = new Set();
    minYearDisplayed = new Date().getFullYear();
    maxYearDisplayed = new Date().getFullYear();
    earliestEntryYear = minYearDisplayed;
    $(".populated").empty();
    $(".populated").removeClass("populated");
    $("#pvmKuvaus").nextAll("tr").remove();
    $("#pvmKuvaus").after(generateInitialYears());
    shrinkYear(maxYearDisplayed);
}

/**
 * @function shrinkYear
 * @description Makes the given year span 1 row
 * @param {year} The year to shrink
 * @returns void
 */
function shrinkYear(year) {
	if (!$("#" + year).hasClass("shrunk")) {
		$("#" + year).attr("rowspan", "1");
		// add 7 empty cells
		$("#" + year).parent().append("<td></td><td></td><td></td><td></td><td></td><td></td><td></td>");
		$("#" + year).addClass("shrunk");

		for(let key of months.keys())
		{
			$("#" + year + "-" + key).detach();
		}
	}
}

/**
 * @function mapContents
 * @description Inserts the data received from eRA into a map used for populating the table
 * @param {entries} The entries to map
 * @param {callback} Function to call to signal the mapping being complete
 * @returns void
 */
function mapContents(entries, callback) {
	for(let entry of entries) {
		var monthId = dateTimeToMonthId(entry.dateTime);
		var year = dateTimeToYear(entry.dateTime);

		if (year < earliestEntryYear) {
			earliestEntryYear = dateTimeToYear(entry.dateTime);
        }

		if(!yearsWithEntries.has(year)) {
			yearsWithEntries.add(year);
        }

		if (!(contentMap.has(monthId))) {
			contentMap.set(monthId, []);
		}

		contentMap.get(monthId).push(entry);
	}

	callback();

}

/**
 * @function adjustFirstContentClass
 * @description Toggles the entry's first content class depending on whether the entry is expanding or not
 * @param {selector} The selector for accessing the first content
 * @param {expanding} A bool value signifying whether the entry is expanding
 * @returns void
 */
function adjustFirstContentClass(selector, expanding)
{
	if (expanding) {
		$(selector).addClass("topEntry");
		$(selector).removeClass("loneEntry");
	}
	else {
		$(selector).addClass("loneEntry");
		$(selector).removeClass("topEntry");
	}
}

/**
 * @function adjustEntryClass
 * @description Changes the content class depending on the size of the entry
 * @param {textSelector} The selector for accessing the content
 * @param {content} The content in question
 * @param {rowNumber} Number of the content's row
 * @param {columnSize} How many column cells does the entry occupy
 * @returns void
 */
function adjustEntryClass(textSelector, content, rowNumber, columnSize)
{
	$(textSelector).removeClass("loneEntry");
	$(textSelector).removeClass("topEntry");
	$(textSelector).removeClass("midEntry");
	$(textSelector).removeClass("bottomEntry");

	if (columnSize == 1) {
        $(textSelector).addClass("loneEntry");
    }
	else if (columnSize >= 2) {
        if (rowNumber == 0) {
            $(textSelector).addClass("topEntry");
        }
        else if ((rowNumber + 1) == columnSize) {
            $(textSelector).addClass("bottomEntry");
        }
        else {
            $(textSelector).addClass("midEntry");
        }

		adjustFirstContentClass("*[data-entry-oid='" + content.entryOid + "'].loneEntry." + content.column + "Text", true);
	}
}

/**
 * @function addTextContent
 * @description Adds content to one of the text columns and adjusts its class
 * @param {selector} The selector for accessing the content
 * @param {content} The content to add
 * @param {rowNumber} Number of the content's row
 * @param {columnSize} How many column cells does the entry occupy
 * @returns void
 */
function addTextContent(selector, content, rowNumber, columnSize)
{
	var textSelector = selector + "Text";

	if ($(textSelector).hasClass("populated")) {
		return;
	}

	adjustEntryClass(textSelector, content, rowNumber, columnSize);

    if (($(textSelector).hasClass("loneEntry") || $(textSelector).hasClass("topEntry")) && content.column == "text") {
        if (!(content.displayText.trim().endsWith("."))) {
            content.displayText += ".";
        }
        
        $(textSelector).append(content.displayText + " <i>" + content.organizationName + " </i>");
    }
    else {
        $(textSelector).append(content.displayText);
    }

	// set attributes and style
	$(textSelector).attr("title", content.displayText);
	$(textSelector).attr("id", content.id);
	$(textSelector).attr("data-entry-oid", content.entryOid);
	$(textSelector).addClass("populated");
	$(textSelector).css("border-color", content.color);
}

/**
 * @function addDateContent
 * @description Adds content to the date column
 * @param {selector} The selector for accessing the content
 * @param {content} The content to add
 * @param {rowSelector} The content's row selector
 * @returns void
 */
function addDateContent(selector, content, rowSelector)
{
	var dateSelector = rowSelector + " .contentDate";
	var addTelecareIcon = false;

	if (content.sectionTitle == "78" && !($(dateSelector).hasClass("telecare")))
	{
		addTelecareIcon = true;
	}

	if (!($(dateSelector).hasClass("populated"))) {
		$(dateSelector).addClass("populated");
		$(dateSelector).attr("data-entry-oid", content.entryOid);
		$(dateSelector).css("background-color", content.color);
		$(dateSelector).append(dateTimeToFinDate(content.dateTime) + " " + content.dataView);
	}

	if(addTelecareIcon)
	{
		$(dateSelector).addClass("telecare");
		$(dateSelector).append("<img src='images/telecareIcon.png' alt='Etäkontakti-ikoni' style='width: auto; height: 13px; vertical-align: text-top; padding-left: 4px;'></img>")
	}
}

/**
 * @function addContent
 * @description Adds content to the table
 * @param {selector} The selector for accessing the content
 * @param {content} The content to add
 * @param {rowSelector} The content's row selector
 * @param {rowNumber} The number of the row the content is on
 * @param {columnSize} How many rows does the entry occupy
 * @returns void
 */
function addContent(selector, content, rowSelector, rowNumber, columnSize)
{
	if (content.displayText == "" || content.displayText == undefined) {
		return;
	}

	addTextContent(selector, content, rowNumber, columnSize);
	addDateContent(selector, content, rowSelector);
}

/**
 * @function shrinkEmptyYears
 * @description Makes all empty years span 1 row
 * @returns void
 */
function shrinkEmptyYears()
{
	for(var year = maxYearDisplayed; year >= minYearDisplayed; year--)
	{
        if (!(yearsWithEntries.has(year))) {
            shrinkYear(year);
        }
	}
}

/**
 * @function populateTable
 * @description Populates the table cells based onn the content map
 * @param {callback} Function to call to signal the population is complete
 * @returns void
 */
function populateTable(callback) {
	var contentMapKeys = contentMap.keys();

	for(var monthId of contentMapKeys) {

		if (contentMap.get(monthId).length > 1) {
			$("#" + monthId + " .month").addClass('expandable');
        }

		// only add the first entry contents initially
		var entry = contentMap.get(monthId)[0];
		var contentTypes = entry.columns.keys();

		for(var contentType of contentTypes)
		{
			if (entry.columns.get(contentType).length == 0) {
				continue;                         
            }

			var selector = "#" + monthId + " ." + contentType;
			var content = entry.columns.get(contentType)[0];

			if (entry.columns.get(contentType).length > 1) {
				$("#" + monthId + " .contentDate").addClass('expandable');
            }

			// add the first content of each column
			addContent(selector, content, "#" + monthId, 0, 1);
		}
		
	}

	if (!(callback == undefined)) {
		callback();
	}
}

/**
 * @function addContentToExpandedMonth
 * @description Adds content to rows expanded upon month expansion
 * @param {row} The expanded row
 * @returns void
 */
function addContentToExpandedMonth(row) {
	var monthId = $(row).parent().attr("id");
	var entries = contentMap.get(monthId);

	// show all entries
	for (var i = 1; i < entries.length; i++)
	{
		var contentTypes = entries[i].columns.keys();

		for(var contentType of contentTypes)
		{
			if (entries[i].columns.get(contentType).length == 0) {
				continue;
            }

			var rowSelector = "." + monthId + ".row-" + i;
			var selector = rowSelector + " ." + contentType;
			var content = entries[i].columns.get(contentType)[0];

			if (entries[i].columns.get(contentType).length > 1) {
				$(rowSelector + " .contentDate").addClass('expandable');
            }

			// add the first content of each column
			addContent(selector, content, rowSelector, i, 1);   
		}
	}
}

/**
 * @function addContentToExpandedEntry
 * @description Adds content to rows expanded upon entry expansion
 * @param {entry} The expanded entry from the contentMap
 * @param {monthId} MonthId of the expanded entry
 * @param {parentRow} The row's parent
 * @returns void
 */
function addContentToExpandedEntry(entry, monthId, parentRow) {

	for (var columnArr of entry.columns.values()) {
		for(var i = 1; i < columnArr.length; i++)
		{
            if (columnArr.length == 0) {
                continue;
            }

			var rowSelector = ".entryExpansion." + parentRow + ".row-" + i;
			var content = columnArr[i];
			var selector = rowSelector + " ." + content.column;

			addContent(selector, content, rowSelector, i, columnArr.length);
		}
	}

	$("#checkShowAllText").trigger("change");
}

/**
 * @function expandMonth
 * @description Expands a month and populates it
 * @param {row} The row the month resides at
 * @param {count} How many rows need to be added
 * @returns void
 */
function expandMonth(row, count) {
	var i = count;

	while(i > 0)
	{
		var columns;

		for(let column of infoColumns) {
			columns += generateInfoCell(column);
		}

		var parentId = $(row).parent().attr("id");
		$(row).parent().after("<tr id=" + parentId + "_row-" + i + " class='expansion " + parentId + " row-" + i + "'>" + columns + "</tr>");

		i--;
		columns = "";
	}

	var year = $(row).parent().attr("id").substring(0, 4);
	var newRowSpan = parseInt($("#" + year).attr("rowspan")) + count;
	$("#" + year).attr("rowspan", "" + newRowSpan);

	$(row).attr("rowspan", "" + (count + 1));

	addContentToExpandedMonth(row);
}

/**
 * @function unexpandMonth
 * @description Unexpands a month, returning it to its original form
 * @param {row} The row the month resides at
 * @param {count} How many rows need to be removed
 * @returns void
 */
function unexpandMonth(row, count) {
	var parentId = $(row).parent().attr("id");

	$(".expansion." + parentId).detach();
	$(".entryExpansion." + parentId).detach();

	var year = parentId.substring(0, 4);

	var monthRowSpan = parseInt($(row).attr("rowspan"));
	var newRowSpan = parseInt($("#" + year).attr("rowspan")) - monthRowSpan + 1;
	$("#" + year).attr("rowspan", newRowSpan);

	$("#" + parentId + " .contentDate.expanded").attr("rowspan", "1");
	$("#" + parentId + " .contentDate.expanded").removeClass("expanded");
	$(row).attr("rowspan", "1");
}

/**
 * @function findLargestColumn
 * @description Finds the largest column of the given entry
 * @param {entry} The entry to find the largest column of
 * @returns {size} Size of the largest column - 1
 */
function findLargestColumn(entry) {
	var max = 1;

	for (var columnArr of entry.columns.values()) {
        if (columnArr.length > max) {
            max = columnArr.length;
        }
	}

	return max - 1;
}

/**
 * @function getMonthEntryCount
 * @description Gets the number of entries for the given month
 * @param {month}
 * @returns {number} Number of entries 
 */
function getMonthEntryCount(month) {
	var monthId = $(month).parent().attr("id");
	var contentSize = 0;
	
	if(contentMap.has(monthId))
	{
		contentSize = contentMap.get(monthId).length;
	}

	return contentSize - 1;
}

/**
 * @function expandEntry
 * @description Expands an entry in the table
 * @param {cell} The cell that was clicked
 * @param {amount} How many rows the entry needs
 * @param {entry} The entry being expanded
 * @param {monthId} MonthId of the entry
 * @returns void
 */
function expandEntry(cell, amount, entry, monthId) {
	var i = amount;

	while (i > 0) {

		var columns;

		for (var j = 1; j < infoColumns.length; j++)
		{
			columns += generateInfoCell(infoColumns[j]);
		}

		var parentRow = $(cell).parent().attr("id");

		$(cell).parent().after("<tr class='entryExpansion " + parentRow + " row-" + i + " " + monthId + "'>" + columns + "</tr>");

		i--;
		columns = "";
	}

	var year = $(cell).parent().attr("id").substring(0, 4);
	var newRowSpan = parseInt($("#" + year).attr("rowspan")) + amount;
	$("#" + year).attr("rowspan", "" + newRowSpan);

	var month = $(cell).parent().attr("id").substring(0, 7);
	newRowSpan = parseInt($("#" + month + " .month").attr("rowspan")) + amount;

    if (isNaN(newRowSpan)) {
        newRowSpan = 1 + amount;
    }

	$("#" + month + " .month").attr("rowspan", "" + newRowSpan);

	$(cell).attr("rowspan", "" + (amount + 1));

	addContentToExpandedEntry(entry, monthId, parentRow);
}

/**
 * @function unexpandEntry
 * @description Unexpands an entry in the table, returning it to its original form
 * @param {cell} The unexpandable cell that was clicked
 * @param {amount} How many rows need to be removed
 * @returns void
 */
function unexpandEntry(cell, amount)
{
    for (var i = 0; i < amount; i++) {
        $(cell).parent().next("tr").remove();
    }

	var year = $(cell).parent().attr("id").substring(0, 4);
	var newRowSpan = parseInt($("#" + year).attr("rowspan")) - amount;
	$("#" + year).attr("rowspan", "" + newRowSpan);

	var month = $(cell).parent().attr("id").substring(0, 7);
	newRowSpan = parseInt($("#" + month + " .month").attr("rowspan")) - amount ;
	$("#" + month + " .month").attr("rowspan", "" + newRowSpan);

	$(cell).attr("rowspan", "1");

	adjustFirstContentClass("*[data-entry-oid='" + $(cell).attr("data-entry-oid") + "'].topEntry", false);
}

/**
 * @function dateClicked
 * @description Handles clicks on dates, expanding/unexpanding entries
 * @param {cell} The date cell that was clicked
 * @returns void
 */
function dateClicked(cell) {
    if (!$(cell).hasClass("expandable")) {
        return;
    }

	var parentId = $(cell).parent().attr("id");
	var monthId;
	var entryId;

	if($(cell).parent().hasClass("expansion"))
	{
		monthId = parentId.substring(0, parentId.indexOf("_"));
		entryId = parentId.substring(parentId.indexOf("row-") + 4, parentId.length);
	}
	else
	{
		monthId = parentId;
		entryId = 0;
	}                  

	var entry = contentMap.get(monthId)[entryId];
	var largestColumn = findLargestColumn(entry);

	if ($(cell).hasClass('expanded')) {
		$(cell).removeClass('expanded');
		unexpandEntry(cell, largestColumn);
	}
	else {
		$(cell).addClass('expanded');
		$("#" + monthId + " .month.expandable:not(.expanded)").trigger("click");
		expandEntry(cell, largestColumn, entry, monthId);
	}

	$(".container").trigger('resize.stickyTableHeaders');
}         

/**
 * @function scrolledUp
 * @description Loads more content when the user scrolls up the container
 * @returns void
 */
function scrolledUp() {
    if ((minYearDisplayed - 1) < earliestEntryYear) {
        return;
    }

	$("#pvmKuvaus").after(generateYear(minYearDisplayed - 1));

	shrinkEmptyYears();

	try {
		populateTable(function () {
			$(".container").removeClass("scrollActive");
			$("#checkExpandAllMonths").trigger("change");
			$("#checkExpandAllEntries").trigger("change");
			$("#checkShowAllText").trigger("change");
		});  
	}
	catch (err) {
		$(".container").removeClass("scrollActive");
	}
}

/****************************************************
*
*
* events
*
*
*****************************************************/

/**
 * @event document.on ajax
 * @description Displays loading spinner upon ajax calls
 */
$(document).on({
	ajaxStart: function () { $("body").addClass("loading"); },
	ajaxStop: function () { $("body").removeClass("loading"); }
});

/**
 * @event checkExpandAllMonths change
 * @description Handles month expansion checkbox changes
 */
$("#checkExpandAllMonths").change(function () {
	if (this.checked) {
		// expand all months
		$(".month.expandable:not(.expanded)").trigger("click");
	}
	else {
		$(".month.expanded").trigger("click");
		$("#checkExpandAllEntries").prop("checked", false).trigger("change");
	}

});

/**
 * @event checkExpandAllEntries change
 * @description Handles entry expansion checkbox changes
 */
$("#checkExpandAllEntries").change(function () {
    if (this.checked) {
        $("#checkExpandAllMonths").prop("checked", true).trigger("change");
        // expand all entries
        $(".contentDate.expandable:not(.expanded").trigger("click");
    }
    else {
        $(".contentDate.expanded").trigger("click");
    }

});

/**
 * @event checkShowAllText change
 * @description Handles text expansion checkbox changes
 */
$("#checkShowAllText").change(function () {
    if (this.checked) {
        $("td.text").css("white-space", "normal");
    }
    else {
        $("td.text").css("white-space", "nowrap");
    }
});

/**
 * @event document ready
 * @description Attaches event handlers when the document is ready
 */
$(document).ready(function () {
	try {
		$("#dataTable").stickyTableHeaders({ scrollableArea: $('.container') });
	}
	catch(err)
	{
		console.log(err);
	}

	$(".container").scrollTop(1);

	$(".container").scroll(function () {
		if (!$(".container").hasClass("scrollActive")) {
			if ($(".container").scrollTop() == 0) {
				setTimeout(scrolledUp, 250);
				setTimeout(function () { $(".container").scrollTop(1); }, 250);
				
			}
		}   
	});

	$(document).tooltip();

	$('.container').scrollLock();

	$(window).resize(function () {
		$(".container").trigger('resize.stickyTableHeaders');
	});

	$("#dataTable").on("click", ".month", function () {
        if (!$(this).hasClass('expandable')) {
            return;
        }

		var expansion = getMonthEntryCount(this);

		if ($(this).hasClass('expanded')) {
			$(this).removeClass('expanded');
			unexpandMonth(this, expansion);
		}
		else {
			$(this).addClass('expanded');
			expandMonth(this, expansion);
		}

		$(".container").trigger('resize.stickyTableHeaders');
	});

	$("#dataTable").on("click", "td", function () {
        if ($(this).hasClass('contentDate')) {
            dateClicked(this);
            return;
        }
        else if (!$(this).hasClass('populated')) {
            return;
        }

		var index = parseInt($(this).attr("id"));
		var content = contentArr[index];

		// get window position
		var dualScreenLeft = window.screenLeft != undefined ? window.screenLeft : screen.left;
		var dualScreenTop = window.screenTop != undefined ? window.screenTop : screen.top;
		var width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
		var height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;
		var left = (((width / 4) * 3) - ((200 / 4) * 3)) + dualScreenLeft;
		var top = ((height / 2) - (300 / 2)) + dualScreenTop;

		var contentWindow = window.open("", "ContentWindow", "left=" + left + ",top=" + top + ",width=200,height=300");
		contentWindow.document.write("<head><title>Merkinnän tiedot</title></head><body style='font-family: Arial, Helvetica, sans-serif'>" + 
			"<h1>" + content.title + "</h1><p>" + content.author + "<br>" +
			content.organizationName + "<br>" +
			dateTimeToFinDateTime(content.dateTime) + "</p><p>" + content.displayText + "</p></body>");
		contentWindow.onblur = function () { this.close(); };
	});
});

/**************************************************************************************************************
*
* Entry points
*
***************************************************************************************************************/

/**
 * @function initTable
 * @description Initializes variables and generates empty table
 * @returns void
 */
function initTable() {
	if ($(".container").hasClass("tableGenerated")) {
        reInit();
        return;
	}

	init();
	$("body").addClass("loading");

	try {
		generateTable();
	}
	catch (err) {
		console.log("Could not generate table because " + err);
	}
}

/**
 * @function runTable
 * @description Maps data and makes the table
 * @param {data} The data to populate the table with
 * @returns void
 */
function runTable(data) {
	contentArr = data.contents;

	try {
		mapContents(data.entries, function () {
			$.holdReady(false);
		});

        populateTable(function () {
            $(".container").scrollTop(1);
			$("body").removeClass("loading");
		});
	}
	catch (err) {
		console.log(err);
	}
}

/**
 * @function run
 * @description Runs the script to generate and populate the table. Gets data from eRAData
 * @returns void
 */
function run(data, sessionId, contextId) {
	initTable();
    
    if (data == undefined || data == null) {
        eRAData.getDataToDisplay(sessionId, contextId, function (err, data) {
            if (err) {
                console.log(err);
            }
            else {
                runTable(data);
            }
        });
    }
    else {
        runTable(data)
    }
}

/**
 * @function doTestUse
 * @description Runs the script to generate the timeline with test data
 * @returns void
 */
function doTestUse() {
    eRAData.doTestUse(function (data) {
        run(data);
    });
}

/**
 * @function receiveMessage
 * @description PostMessage entry points
 * @returns void
 */
function receiveMessage(event) {
    if (event.data.event == "patient_open") {
        run(null, event.data.sessionId, event.data.contextId);
    }
    else if (event.data.event == "test_use") {
        doTestUse();
    }
    else {
        run(event.data);
    }
}

window.addEventListener("message", receiveMessage, false);