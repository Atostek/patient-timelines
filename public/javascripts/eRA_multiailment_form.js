var timeline;
var dataViewColors = new Map();
var contentArr = [];

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
 * @function generateTextEvent
 * @description Generates the text for the given timeline event from the given text entry array
 * @param {textColumn} The array containing all the notes of the entry
 * @param {event} The event to generate the text for
 * @returns {event} The modified event
 */
function generateTextEvent(textColumn, event) {
	event.text.headline = textColumn[0].dataView;
	event.text.text = "";
	event.unique_id = "" + textColumn[0].id;

	return event;
}

/**
 * @function adjustStyles
 * @description Adjusts the look of the timeline
 * @returns void
 */
function adjustStyles() {
	for (var i = 0; i < contentArr.length; i++) {
		var markerId = i + "-marker";
		$("#" + markerId + " .tl-timemarker-content-container").css("background-color", dataViewColors.get(contentArr[i].dataView));
	}

	$(".tl-headline-fadeout").removeClass("tl-headline-fadeout");
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
		var event = {};
		event.start_date = {};
		event.text = {};
		var date = new Date(entry.dateTime);

		event.start_date.day = date.getDate();
		event.start_date.month = date.getMonth();
		event.start_date.year = date.getFullYear();

		var contentTypes = entry.columns.keys();

		for(var contentType of contentTypes)
		{
			if (entry.columns.get(contentType).length == 0) {
				continue;
            }
			if (contentType == "text") {		              
				timelineJson.events.push(generateTextEvent(entry.columns.get("text"), event));
			}
		}
	}

	return timelineJson;
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
		timenav_height_percentage: 60,
		timenav_height_min: 280,
		marker_height_min: 55,
		marker_padding: 5,
		marker_width_min: 140,
		scale_factor: 0.5,
		start_at_end: true,
		zoom_sequence: [0.5, 1, 2, 3, 5, 8, 13, 21, 34, 55],
		language: "https://cdn.knightlab.com/libs/timeline3/latest/js/locale/fi.json"
	};

	timeline = new TL.Timeline('timeline-embed', timelineJson, options);

	adjustStyles();

	$("body").toggleClass("loading");
}

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

$(document).ready(function () {
	window.addEventListener("message", receiveMessage, false);
});
