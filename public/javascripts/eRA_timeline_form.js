
var timeline;
var timelineEvents = new Map(); // maps the TimelineJS events with the patient data
var dataViewColors = new Map();
var dataViews = [];
var visibleDataViews = [];
var searchResults = [];
var currentSearchResultId;
var contentArr = [];
var SECTION_TITLE_TELECARE = "78";

/******************************************************
*
*   Timeline functions
*
******************************************************/

/**
 * @function initDataViewColors
 * @description Parses JSON of dataview colors into a map
 * @returns void
 */
function initDataViewColors() {
	$.getJSON("misc/dataviewColors.json", function (data) {

		$.each(data, function (key, value) {
			var dataview = value;
			dataViewColors.set(dataview.name, "rgb(" + dataview.color + ")");
		});
	});
}

/**
 * @function updateSearchResultSpan
 * @description Updates the element containing the number of search results
 * @returns void
 */
function updateSearchResultSpan() {
	$("#searchResultsNumber").empty();

    if ($("#searchField").val() == "") {
        return;
    }

    if (searchResults.length == 0) {
        $("#searchResultsNumber").append("Ei tuloksia");
    }
    else {
        $("#searchResultsNumber").append("Tulos " + (parseInt(currentSearchResultId) + 1) + "/" + searchResults.length);
    }
}

/**
 * @function mark
 * @description Highlights the given term in the timeline
 * @param {term} The term to mark
 * @returns void
 */
function mark(term)
{                
	$("#timeline-embed").unmark({
		done: function () {
            if (term != "") {
                $("#timeline-embed").mark(term);
            }
            else {
                $(".tl-timemarker-content-container.searchResult").removeClass("searchResult");
            }
		}
	});
}

/**
 * @function search
 * @description Finds the given term in the timeline and updates search results
 * @param {term} The term to search for
 * @returns void
 */
function search(term) {
	searchResults = [];
	term = term.toLowerCase();

	for (var i = 0; i < timeline.config.events.length; i++) {
		var event = timeline.config.events[i];

        if (event.text.text.toLowerCase().includes(term) || event.text.headline.toLowerCase().includes(term)) {
            if (term != "") {
                searchResults.push(event.unique_id);
                $("#" + event.unique_id + "-marker .tl-timemarker-content-container").addClass("searchResult");
            }
        }
        else {
            $("#" + event.unique_id + "-marker .tl-timemarker-content-container").removeClass("searchResult");
        }
	}
	
	if (searchResults.length > 0) {
		timeline.goToId(searchResults[0]);
		currentSearchResultId = 0;
	}

	mark(term);
	updateSearchResultSpan();              
}

/**
 * @function getDataViewMediaContainer
 * @description Generates a tl-timemarker-media-container containing the dataview abbreviation
 * @param {content} The content to generate the container for
 * @returns {container}
 */
function getDataViewMediaContainer(content) {
	var fontSize = "12px";

    if (content.dataView.length > 3) {
        fontSize = "9px";
    }

	var container = "<div class='tl-timemarker-media-container' " +
		"style='float: left; min-height:100%'>" +
			"<span class='tl-icon-' style='" +
			"word-break: break-word;" +
			"max-width: 8px;" +
			"font-family: Arial;" +
			"font-size: " + fontSize + ";" +
			"text-align: center;" +
			"font-weight: bolder;" +
			"color: " + dataViewColors.get(content.dataView) + "'>" +
			content.dataView +
			"</span>"; +
		"</div>";

	return container;
}

/**
 * @function addAuthorAndOrganization
 * @description Adds the author and organization to the text of the timeline content
 * @param {content} The content to add the info to
 * @returns {text}
 */
function addAuthorAndOrganization(content)
{
	var text = "";
	text += "<i><p>" + content.author + "<br>";
	text += (content.organizationName == undefined) ? "" : content.organizationName + "</i></p>";

	return text;
}

/**
 * @function generateTextEntryEventText
 * @description Generates the text for the given timeline event from the given text entry array
 * @param {textColumn} The array containing all the notes of the entry
 * @param {event} The event to generate the text for
 * @returns {event} The modified event
 */
function generateTextEntryEventText(textColumn, event) {
	event.text.headline = textColumn[0].displayText;
	event.text.text = "";
	event.group = textColumn[0].title;
	event.unique_id = "" + textColumn[0].id;

    if (textColumn[0].sectionTitle == SECTION_TITLE_TELECARE) {
        event.text.text += "<p>Etäkontakti</p>";
    }

	for (var i = 1; i < textColumn.length; i++) {
		event.text.text += "<p>";
		event.text.text += textColumn[i].displayText;
		event.text.text += "</p>";
	}

	event.text.text += addAuthorAndOrganization(textColumn[0]);
	
	return event;
}

/**
 * @function generateOtherEventText
 * @description Generates the text for a timeline event from the given content
 * @param {content} The content to generate the text from
 * @returns {text} The generated text
 */
function generateOtherEventText(content) {
	var text = "";

	switch (content.column) {
		case "diagnosis":
			text += "<p>Diagnoosin tekijä: " + content.author + "</p>";
			text += "<p>";
			text += (content.details.certainty == undefined) ? "" : "Varmuus: " + eRAData.translateTerm(content.details.certainty) + "<br>";
			text += (content.details.permanence == undefined) ? "" : "Pysyvyys: " + eRAData.translateTerm(content.details.permanence) + "<br>";
			text += (content.details.primarity == undefined) ? "" : "Ensisijaisuus: " + eRAData.translateTerm(content.details.primarity);
			text += "</p>";
			break;
		case "medication":
			text += "<p>";
			text += (content.details.intendedUse == undefined) ? "" : content.details.intendedUse + "</p><p>";
			text += content.details.strength + " " + content.details.dosageForm + "<br>";
			text += content.details.instructions;
			text += "</p><p>";
			text += "Määrätty " + ((content.details.quantity.packageCount == undefined) ? "" : (" " + content.details.quantity.packageCount + " kpl ")) +
				content.details.quantity.value + " " + eRAData.translateTerm(content.details.quantity.unit) + " " + eRAData.translateTerm(content.details.quantity.type) + ".";
			text += "</p>";
			break;
		case "treatment":
			text += "<p>";
			text += (content.details.actionReport == undefined) ? "" : content.details.actionReport;
			text += "</p>";
			break;
		default:
			break;
	}

	text += addAuthorAndOrganization(content);

	return text;
}

/**
 * @function generateOtherEvent
 * @description Generates a timeline event from the given content
 * @param {content} The content to generate the event from
 * @param {event} The resulting event
 * @returns {event} The modified event
 */
function generateOtherEvent(content, event) {
	event.text.headline = content.displayText;
	event.text.text = generateOtherEventText(content);
	event.group = content.title;
	event.unique_id = "" + content.id;

	return event;
}

/**
 * @function appendDataViewsToDate
 * @description Adds the dataview of each event after its date in the timeline slide
 * @returns void
 */
function appendDataViewsToDate()
{
	$(".tl-slide.tl-slide-text-only").each(function (index) {
		try {
			var id = parseInt($(this).attr("id"));

			$(this).find(".tl-headline-date").append(" - " + contentArr[id].dataView);
		}
		catch (err) {

		}
	});
}

/**
 * @function adjustStyles
 * @description Adjusts the look of the timeline
 * @returns void
 */
function adjustStyles() {
	for (var i = 0; i < contentArr.length; i++) {
        var markerId = i + "-marker";
        
        // adjust the border color of events
		$("#" + markerId + " .tl-timemarker-content-container").css("border", contentArr[i].color + " solid 2px");
        
        // add media containers to events
		$("#" + markerId + " .tl-timemarker-text").before(getDataViewMediaContainer(contentArr[i]));
	}
    
    // add data views after the dates of the event slides
	appendDataViewsToDate();
    
    $(".tl-timemarker .tl-timemarker-content-container").css("min-width", "130px");
    $("table#settings").css("opacity", "1");
}

/**
 * @function toggleBorderColor
 * @description Toggles the border color of the timeline events between service event and dataview
 * @param {option} The selected color option
 * @returns void
 */
function toggleBorderColor(option)
{
	var color;

	for (var i = 0; i < contentArr.length; i++) {
		if (option == "serviceEvent") {
            color = contentArr[i].color;
        }
		else if (option == "dataView") {
			color = dataViewColors.get(contentArr[i].dataView);
		}

		var markerId = i + "-marker";

        if (color != undefined) {
            $("#" + markerId + " .tl-timemarker-content-container").css("border", color + " solid 2px");
        }
        else {
            $("#" + markerId + " .tl-timemarker-content-container").css("border", "");
        }
	}
}

/**
 * @function initEvent
 * @description Initializes an event with the datetime of the given entry
 * @param {entry}
 * @returns {event} The initialized event
 */
function initEvent(entry)
{
	var event = {};
	event.start_date = {};
	event.text = {};

	var date = new Date(entry.dateTime);
	event.start_date.day = date.getDate();
	event.start_date.month = parseInt(date.getMonth()) + 1;
	event.start_date.year = date.getFullYear();

	return event;
}

/**
 * @function generateTimelineJson
 * @description Generates data for TimelineJS to use
 * @param {entries} The patient entries to generate the data from
 * @returns {timelineJson} The generated TimelineJS form data
 */
function generateTimelineJson(entries) {
	var timelineJson = {};
	timelineJson.events = [];

	for(let entry of entries)
	{
		var event = initEvent(entry);			        
		var contentTypes = entry.columns.keys();
	   
		if (!doesDataViewExist(entry.dataView)) {
			dataViews.push(entry.dataView);
        }

		for(var contentType of contentTypes)
		{
			if (entry.columns.get(contentType).length == 0) {
				continue;
            }

			if (contentType == "medication")
			{
				if (!doesDataViewExist("VLÄÄ")) {
					dataViews.push("VLÄÄ");
                }
			}

			if (contentType == "text") {
				var timelineEvent = {};
				timelineEvent.data = generateTextEntryEventText(entry.columns.get("text"), event);
				timelineJson.events.push(timelineEvent.data);                            
				timelineEvents.set(timelineEvent.data.unique_id, timelineEvent);
			}
			else {
				for (var i = 0; i < entry.columns.get(contentType).length; i++) {
					var content = entry.columns.get(contentType)[i];
					event = initEvent(entry);

					try {
						var timelineEvent = {};
						timelineEvent.data = generateOtherEvent(content, event);
						timelineJson.events.push(timelineEvent.data);
						timelineEvents.set(timelineEvent.data.unique_id, timelineEvent);
					}
					catch(err) { }
				}
			}
		}
	}

	return timelineJson;
}

/**
 * @function filterDataView
 * @description Filters a dataview from the timeline or adds it back
 * @param {dataView} The dataview to filter
 * @param {isBeingFiltered} Is the dataview being filtered or unfiltered
 * @returns void
 */
function filterDataView(dataView, isBeingFiltered) {
	for(var id of timelineEvents.keys())
	{
		if(contentArr[parseInt(id)].dataView == dataView)
		{
			if (isBeingFiltered) {
				hideEvent(id);
			}
			else {
				showEvent(id);
			}
		}
	}
}

/**
 * @function isDataViewVisible
 * @description Checks if the given data view is among visible data views
 * @param {dataView} The dataview to check
 * @returns bool
 */
function isDataViewVisible(dataView)
{
	for (var i = 0; i < visibleDataViews.length; i++)
	{
		if (visibleDataViews[i] == dataView) {
			return true;
		}
	}

	return false;
}

/**
 * @function changeSearchResult
 * @description Goes to the next search result in the given direction
 * @param {direction} The direction of the change
 * @returns void
 */
function changeSearchResult(direction) {
    if (direction > 0 && currentSearchResultId == (searchResults.length - 1)) {
        return;
    }
    if (direction < 0 && currentSearchResultId == 0) {
        return;
    }

	try {
		currentSearchResultId = parseInt(currentSearchResultId) + parseInt(direction);
		timeline.goToId(searchResults[parseInt(currentSearchResultId)]);
		updateSearchResultSpan();
	}
	catch (err) { }
}

/**
 * @function generateDataViewOptions
 * @description Generates the options of the dataview select element based on available dataviews
 * @returns void
 */
function generateDataViewOptions() {
    $("#dataViewSelect").empty();
	for (var i = 0; i < dataViews.length; i++) {
		visibleDataViews.push(dataViews[i]);
		$("#dataViewSelect").append("<option value=" + dataViews[i] + " selected='selected'>" + dataViews[i] + "</option>");
	}
}

/**
 * @function doesDataViewExist
 * @description Checks if the given dataview has been seen
 * @param {dataView} The dataview whose existence is being checked
 * @returns bool
 */
function doesDataViewExist(dataView) {
	for (var i = 0; i < dataViews.length; i++) {
		if (dataViews[i] == dataView) {
			return true;
		}
	}

	return false;
}

/**
 * @function toggleMultiailmentView
 * @description Toggles multiailment view mode on and off
 * @param {isChecked} Is the checkbox checked
 * @returns void
 */
function toggleMultiailmentView(isChecked) {
    if (isChecked) {
        $("input[type=radio][value='dataView']").prop("checked", true);
        $("#dataViewSelect").children().prop("selected", "selected");
        $("#dataViewSelect").prop("disabled", true);
        $("#dataViewSelect").trigger("change");
    }
    else {
        $("#dataViewSelect").prop("disabled", false);
    }

	for(var id of timelineEvents.keys())
	{
		if (contentArr[parseInt(id)].column != "text") {
            if (!isChecked) {
                showEvent(id);
            }
            else {
                hideEvent(id);
            }
		}
	}

	$("input[type=radio][name=colors]").trigger("change");
}

/**
 * @function hideEvent
 * @description Hides the given event
 * @param {id} The id of the event being hidden
 * @returns void
 */
function hideEvent(id) {
	$("#" + id + "-marker").children().addClass("hidden");
}

/**
 * @function showEvent
 * @description Shows the given event
 * @param {id} The id of the event being shown
 * @returns void
 */
function showEvent(id) {
	$("#" + id + "-marker").children().removeClass("hidden");
}

/************************************************************************
*
*   UI events
*
*************************************************************************/

// A dataview was selected or unselected
$("#dataViewSelect").change(function () {
    
    // Show events with the selected dataview
	$("#dataViewSelect option:selected").each(function () {
		var dataView = $(this).val();

		if (!isDataViewVisible(dataView)) {
			filterDataView(dataView, false)
			visibleDataViews.push(dataView);
		}
	});
    
    // Hide events with not selected dataviews
	$('#dataViewSelect option:not(:selected)').each(function () {
		var dataView = $(this).val();

		filterDataView(dataView, true);

		var index = visibleDataViews.indexOf(dataView);

		if (index > -1) {
			visibleDataViews.splice(index, 1);
		}

	});

	$("input[type=radio][name=colors]").trigger("change");
});

// Border color option selection changed
$("input[type=radio][name=colors]").change(function () {
    if (this.checked) {
        toggleBorderColor(this.value);
    }
});

// Clear button of the search function was clicked
$("#clearButton").click(function () {
	$("#searchField").val("");
	$(".tl-timemarker-content-container.searchResult").removeClass("searchResult");
	$("#searchField").trigger("input");
});

// Search field changed
$("#searchField").on("input", function () {
	var term = $("#searchField").val();

	search(term);
});

$("#nextSearchResult").click(function () {
	changeSearchResult(1);
});

$("#previousSearchResult").click(function () {
	changeSearchResult(-1);
});

$("#multiailmentCheck").change(function () {
	toggleMultiailmentView(this.checked);
});

window.addEventListener("message", receiveMessage, false);

/**************************************************************************************************************
*
* Entry points
*
***************************************************************************************************************/

/**
 * @function run
 * @description Runs the script to generate the timeline
 * @param {data} Existing data to populate the timeline with
 * @param {sessionId} eRA session ID for fetching patient data
 * @param {contextId} eRA context ID for fetching patient data
 * @returns void
 */
function run(data, sessionId, contextId) {
	$("body").toggleClass("loading");
    initDataViewColors();
    
    if (data == undefined || data == null) {
        eRAData.getDataToDisplay(sessionId, contextId, function (err, data) {
            if (err) {
                console.log(err);
            }
            else {
                generateTimeline(data);
            }
        });
    }
    else {
        generateTimeline(data);
    }
}

/**
 * @function generateTimeline
 * @description Initialises and generates the timeline
 * @returns void
 */
function generateTimeline(data) {
	timeline = {};

	contentArr = data.contents;

	var timelineJson = generateTimelineJson(data.entries);

	var options = {
		timenav_height_percentage: 55,
		timenav_height_min: 280,
		marker_height_min: 55,
		marker_padding: 5,
		marker_width_min: 140,
		scale_factor: 2,
		start_at_end: true,
		zoom_sequence: [0.5, 1, 2, 3, 5, 8, 13, 21, 34, 55],
		language: "https://cdn.knightlab.com/libs/timeline3/latest/js/locale/fi.json"
	};

	timeline = new TL.Timeline('timeline-embed', timelineJson, options);

    adjustStyles();
    
    generateDataViewOptions();

	$("body").toggleClass("loading");
}

/**
 * @function doTestUse
 * @description Runs the script to generate the timeline with test data
 * @returns void
 */
function doTestUse() {
	eRAData.doTestUse(function(data) {
		run(data);
	});
}

/**
 * @function receiveMessage
 * @description PostMessage entry points
 * @returns void
 */
function receiveMessage(event) {
	if(event.data.event == "patient_open")
	{
		run(null, event.data.sessionId, event.data.contextId);
	}
	else if(event.data.event == "test_use")
	{
		doTestUse();
	}
	else
	{
		run(event.data);
	}
}
