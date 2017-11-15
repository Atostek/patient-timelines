"use strict";
var eRAData = window.eRAData || {};
var EDEMO_URL = "https://erasmartcard.ehoito.fi:44304/Forward/Demo6";
var SECTION_TITLE_CHIEF_COMPLAINT = "79";

// global variables
var contextId = "";
var sessionId = "";
var YEARS_TO_SEARCH = 2;
var existingServiceEvents = [];
var serviceEventColors = [];
var displayContentArr = [];
var addCounter = 0;

/**
 * @function DisplayContent
 * @description Class DisplayContent represents a displayable patient data content
 * @param {type} The type of the content, e.g. medication
 * @param {entry} The entry the content belongs to
 */
function DisplayContent(type, entry) {
    this.type = type;
    this.serviceEventOid = entry.serviceEventOid;
    this.entryOid = entry.oid;
    this.color = entry.color;
    this.dateTime = entry.dateTime;
    this.dataView = entry.dataView;
    this.sectionTitle = "";
    this.organizationName = entry.organizationName;
    this.author = entry.author;
    this.details = {};
}

/**
 * @function Entry
 * @description Class Entry represents a single entry containing columns of display contents
 * @param {oid} The ID of the entry
 */
function Entry(oid) {
    this.oid = oid;
    this.dateTime = "";
    this.color = "";
    this.serviceEventOid = "";
    this.dataView = "";
    this.organizationOid = "";
    this.organizationName = "";

    this.columns = new Map();
    this.columns.set("text", []);
    this.columns.set("exam", []);
    this.columns.set("diagnosis", []);
    this.columns.set("treatment", []);
    this.columns.set("medication", []);
}

/**
 * @function addLeadingZero
 * @description Adds a zero before a number if it is less than 10
 * @param {number} The number to potentially add the zero to
 * @returns {number}
 */
function addLeadingZero(number) {
	if(number < 10) {
		number = '0' + number;
	}
	
	return number;
}

/**
 * @function eRAFormatDateTime
 * @description Returns the given date in eRA format
 * @param {year} 
 * @param {month} 
 * @param {day} 
 * @param {hour} 
 * @param {minute} 
 * @param {second} 
 * @returns {dateTime} The datetime in eRA format
 */
function eRAFormatDateTime(year, month, day, hour, minute, second) {
	var dateTime = year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second;
	
	return dateTime;
}

/**
 * @function getEntries
 * @description Builds a query and fetches entries from eRA
 * @param {callback}
 * @returns callback(err, response)
 */
eRAData.getEntries = function (callback) {
    var query = "<type>all_registries</type>" +
                "<purpose>display_to_user</purpose>" +
                "<reason_code>2</reason_code>" +
                "<get_structured_contents>1</get_structured_contents>";

    var request = "<request>" +
                    "<session_id>" + sessionId + "</session_id>" +
                    "<context_id>" + contextId + "</context_id>" +
                    "<get_entries>" +
                    "<query>" + query + "</query>" +
                    "</get_entries>" +
                    "</request>";

    $.ajax({
        type: "POST",
        url: EDEMO_URL + "/Archive/GetEntries",
        dataType: "xml",
        contentType: "application/xml",
        data: request,
        success: function (response, textStatus, jqXHR) {
            callback(null, response);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            callback(errorThrown, null);
        }
    });
};

/**
 * @function closeServiceEvent
 * @description Closes the currently opened service event
 * @param {callback} 
 * @returns callback(err, response)
 */
eRAData.closeServiceEvent = function (callback) {
    var request = "<request>" +
                    "<session_id>" + sessionId + "</session_id>" +
                    "</request>";

    $.ajax({
        type: "POST",
        url: EDEMO_URL + "/ServiceEvent/CloseEvent",
        dataType: "xml",
        contentType: "application/xml",
        data: request,
        success: function (response, textStatus, jqXHR) {
            callback(null, response);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            callback(errorThrown, null);
        }
    });
};

/**
 * @function getDateTimeXYearsAgo
 * @description Returns an eRA format datetime from X years ago
 * @param {years} 
 * @returns {dateTime}
 */
eRAData.getDateTimeXYearsAgo = function(years) {
	var dateNow = new Date();
	var dateTime;
	var year = dateNow.getFullYear() - years;
	var month = addLeadingZero(dateNow.getMonth() + 1);
	var day = addLeadingZero(dateNow.getDate());
	var hour = addLeadingZero(dateNow.getHours());
	var minute = addLeadingZero(dateNow.getMinutes());
	var second = addLeadingZero(dateNow.getSeconds());
	
	dateTime = eRAFormatDateTime(year, month, day, hour, minute, second);
	
	return dateTime;
}

/**
 * @function generateSearchParams
 * @description 
 * @returns {searchParams}
 */
eRAData.generateSearchParams = function() {
	var startDateTime = eRAData.getDateTimeXYearsAgo(YEARS_TO_SEARCH);
	var endDateTime = eRAData.getDateTimeXYearsAgo(0);
    
    var searchParams = {};
	searchParams.startDateTime = startDateTime;
	searchParams.endDateTime = endDateTime;
		
	return searchParams;
};

/**
 * @function formatGetServiceEventsRequest
 * @description
 * @param {searchParams} 
 * @returns {getServiceEventsRequest}
 */
eRAData.formatGetServiceEventsRequest = function(searchParams) {
	var getServiceEventsRequest = "<request>" +
								"<session_id>" + sessionId + "</session_id>" +
								"<context_id>" + contextId + "</context_id>" +
								"<get_service_events>" +
								"<params>" +
								"<start_time>" + searchParams.startDateTime + "</start_time>" +
								"<end_time>" + searchParams.endDateTime + "</end_time>" +
								"<only_current_organization></only_current_organization>" +
								"<status_list></status_list>" +
								"</params>" +
								"</get_service_events>" +
								"</request>";
								
	return getServiceEventsRequest;
}

/**
 * @function parseServiceEvents
 * @description Finds service events in a response
 * @param {xmlResponse} 
 * @returns {serviceEvents}
 */
eRAData.parseServiceEvents = function(xmlResponse) {
    var serviceEvents = xmlResponse.getElementsByTagName("service_event");

    if (serviceEvents.length == 0) {
        return null;
    }

    return serviceEvents;
}

/**
 * @function getServiceEvents
 * @description Asks eRA for service events
 * @param {searchParams} 
 * @param {callback}
 * @returns callback(err, response)
 */
eRAData.getServiceEvents = function(searchParams, callback) {
	
	var request = eRAData.formatGetServiceEventsRequest(searchParams);
	
	$.ajax({
		type: "POST",
		url: EDEMO_URL + "/ServiceEvent/GetEvents",
		dataType: "xml",
		contentType: "application/xml",
		data: request,
		success: function (response, textStatus, jqXHR) {
			callback(null, response);
		},
		error: function (jqXHR,textStatus,errorThrown) {
			callback(errorThrown, null);
		}
	});
};

/**
 * @function createServiceEvent
 * @description Creates a service event
 * @param {callback} 
 * @returns callback(err, serviceEventOid)
 */
eRAData.createServiceEvent = function(callback) {
    var createServiceEventRequest = "<request>" +
                        "<session_id>" + sessionId + "</session_id>" +
                        "<context_id>" + contextId + "</context_id>" +
                        "<create_service_event>" +
                        "<start_time>" + eRAData.getDateTimeXYearsAgo(0) + "</start_time>" +
                        "</create_service_event>" +
                        "</request>";

    $.ajax({
        type: "POST",
        url: EDEMO_URL + "/ServiceEvent/CreateEvent",
        dataType: "xml",
        contentType: "application/xml",
        data: createServiceEventRequest,
        success: function (response, textStatus, jqXHR) {
            var oid = $(result).find("oid").text();

            callback(null, oid);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            callback(errorThrown, null);
        }
    });
}

/**
 * @function openServiceEvent
 * @description Opens given service event
 * @param {serviceEventOid}
 * @param {callback} 
 * @returns callback(err, response)
 */
eRAData.openServiceEvent = function(oid, callback) {
	var openServiceEventRequest = "<request>" +
							"<session_id>" + sessionId + "</session_id>" +
							"<context_id>" + contextId + "</context_id>" +
							"<open_service_event>" +
							"<oid>" + oid + "</oid>" +
							"</open_service_event>" +
							"</request>";
							
	$.ajax({
		type: "POST",
		url: EDEMO_URL + "/ServiceEvent/OpenEvent",
		dataType: "xml",
		contentType: "application/xml",
		data: openServiceEventRequest,
		success: function (response, textStatus, jqXHR) {
			callback(null, response);
		},
		error: function (jqXHR,textStatus,errorThrown) {
			callback(errorThrown, null);
		}
	});
};

/**
 * @function getUniqueColor
 * @description Returns a color that has not been used in a service event yet
 * @returns {rgbColor}
 * @returns {null} if all colors used
 */
eRAData.getUniqueColor = function () {
    var Colors = {};

    Colors.names = {
        aqua: "#00ffff",
        azure: "#f0ffff",
        beige: "#f5f5dc",
        cyan: "#00ffff",
        darkkhaki: "#bdb76b",
        darkorange: "#ff8c00",
        darksalmon: "#e9967a",
        fuchsia: "#ff00ff",
        gold: "#ffd700",
        khaki: "#f0e68c",
        lightblue: "#add8e6",
        lightgreen: "#90ee90",
        lightpink: "#ffb6c1",
        lime: "#00ff00",
        magenta: "#ff00ff",
        orange: "#ffa500",
        pink: "#ffc0cb",
        yellow: "#ffff00"
    };

    Colors.random = function () {
        var result;
        var count = 0;
        for (var colorName in this.names) {
            if (Math.random() < 1 / ++count) {
                result = colorName;
            }
        }
        return { name: result, rgb: this.names[result] };
    };

    var color;

    // out of colors
    if (serviceEventColors.length >= 20) {
        return null;
    }

    do {
        color = Colors.random();
    }
    while (serviceEventColors.includes(color.rgb));
    
    serviceEventColors.push(color.rgb);
    return color.rgb;
}

/**
 * @function translateTerm
 * @description Translates a given term from english to finnish
 * @param {term} Service event oid
 * @returns {translation}
 */
eRAData.translateTerm = function (term) {
    var translation = "";

    switch (term) {
        case "probable_or_definite":
            translation = "Todennäköinen tai varma";
            break;
        case "suspect":
            translation = "Epäilty";
            break;
        case "temporary":
            translation = "Väliaikainen";
            break;
        case "permanent":
            translation = "Pysyvä";
            break;
        case "primary":
            translation = "Ensisijainen";
            break;
        case "secondary":
            translation = "Toissijainen";
            break;
        case "duration":
            translation = "ajaksi";
            break;
        case "a":
            translation = "vuoden";
            break;
        case "package":
            translation = "pakkausta";
            break;
        default:
            translation = term;
            break;
    }

    return translation;
}

/**
 * @function getServiceEventColor
 * @description Gets the color of a service event or assigns a new one 
 * @param {oid} Service event oid
 * @returns {rgbColor}
 */
eRAData.getServiceEventColor = function (oid) {
    for (let event of existingServiceEvents) {
        if (event.oid == oid) {
            return event.color;
        }
    }

    // event does not exist, need a unique color
    var color = eRAData.getUniqueColor();
    var newEvent = {};
    newEvent.color = color;
    newEvent.oid = oid;

    existingServiceEvents.push(newEvent);

    return color;

}

/**
 * @function parseDiagnosisDetails
 * @description Parses the details of a diagnosis content
 * @param {currentContent}
 * @returns {details}
 */
function parseDiagnosisDetails(currentContent)
{
    var details = {};

    try {
        details.certainty = currentContent.getElementsByTagName("certainty")[0].childNodes[0].nodeValue;
    } catch (err) { }

    try {
        details.permanence = currentContent.getElementsByTagName("permanence")[0].childNodes[0].nodeValue;
    } catch (err) { }

    try {
        details.primarity = currentContent.getElementsByTagName("primarity")[0].childNodes[0].nodeValue;
    } catch (err) { }

    return details;
}

/**
 * @function parseMedicationDetails
 * @description Parses the details of a medication content
 * @param {currentContent}
 * @returns {details}
 */
function parseMedicationDetails(currentContent) {
    var details = {};

    try {
        details.intendedUse = currentContent.getElementsByTagName("intended_use_description")[0].childNodes[0].nodeValue;
        details.strength = currentContent.getElementsByTagName("strength")[0].childNodes[0].nodeValue;
        details.instructions = currentContent.getElementsByTagName("dosage_instructions")[0].childNodes[0].nodeValue;
        details.dosageForm = currentContent.getElementsByTagName("dosage_form")[0].childNodes[0].nodeValue;
        details.quantity = {};
        details.quantity.type = currentContent.getElementsByTagName("quantity_type")[0].childNodes[0].nodeValue;
        details.quantity.value = currentContent.getElementsByTagName("quantity_value")[0].childNodes[0].nodeValue;
        details.quantity.unit = currentContent.getElementsByTagName("quantity_unit")[0].childNodes[0].nodeValue;
        details.quantity.packageCount = currentContent.getElementsByTagName("package_count")[0].childNodes[0].nodeValue;
    }
    catch (err) {
        // this is fine
    }

    return details;
}

/**
 * @function parseContentData
 * @description Parses the given content into DisplayContents
 * @param {currentContent} 
 * @param {displayContent} 
 * @returns {displayContent} The display content with new properties
 */
eRAData.parseContentData = function (currentContent, displayContent) {
    try {
        switch (displayContent.type) {
            case "text":
                displayContent.displayText = currentContent.getElementsByTagName("simple_text")[0].childNodes[0].nodeValue;
                displayContent.title = "Merkintä";
                displayContent.column = "text";
                break;
            case "treatment":
                displayContent.dateTime = currentContent.getElementsByTagName("time")[0].childNodes[0].nodeValue;
                displayContent.displayText = currentContent.getElementsByTagName("code")[1].childNodes[0].nodeValue;
                displayContent.displayText += " " + currentContent.getElementsByTagName("name")[0].childNodes[0].nodeValue;
                displayContent.title = "Toimenpide";
                displayContent.column = "treatment";
                try {
                    displayContent.details.actionReport = currentContent.getElementsByTagName("action_report")[0].childNodes[0].nodeValue;
                }
                catch (err) {
                    // this is fine
                }
                break;
            case "imaging_report":
                displayContent.displayText = currentContent.getElementsByTagName("description")[0].childNodes[0].nodeValue;
                displayContent.title = "Kuvantamisraportti";
                displayContent.column = "exam";
                break;
            case "labtest_report":
                displayContent.displayText = currentContent.getElementsByTagName("report")[0].childNodes[0].nodeValue;
                displayContent.title = "Laboratorioraportti";
                displayContent.column = "exam";
                break;
            case "treatment_need":
                displayContent.title = "Hoitotarve";
                displayContent.displayText = currentContent.getElementsByTagName("name")[0].childNodes[0].nodeValue;
                displayContent.displayText += ": " + currentContent.getElementsByTagName("description")[0].childNodes[0].nodeValue;
                displayContent.column = "exam";
                break;
            case "treatment_action":
                displayContent.title = "Hoitotoimenpide";
                displayContent.displayText = currentContent.getElementsByTagName("name")[0].childNodes[0].nodeValue;
                displayContent.displayText += ": " + currentContent.getElementsByTagName("description")[0].childNodes[0].nodeValue;
                displayContent.column = "treatment";
                break;
            case "physiological_measurement":
                displayContent.title = "Mittaus";
                displayContent.displayText = currentContent.getElementsByTagName("name")[0].childNodes[0].nodeValue;
                displayContent.displayText += " " + currentContent.getElementsByTagName("value")[0].childNodes[0].nodeValue;
                displayContent.displayText += " " + currentContent.getElementsByTagName("unit")[0].childNodes[0].nodeValue;
                displayContent.column = "exam";
                break;
            case "medication":
                displayContent.displayText = currentContent.getElementsByTagName("drug_name")[0].childNodes[0].nodeValue;
                displayContent.title = "Lääkitys";
                displayContent.column = "medication";
                displayContent.details = parseMedicationDetails(currentContent);
                break;
            case "diagnosis":
                displayContent.title = "Diagnoosi";
                displayContent.displayText = currentContent.getElementsByTagName("code")[0].getElementsByTagName("code")[0].childNodes[0].nodeValue;
                displayContent.displayText += " " + currentContent.getElementsByTagName("name")[0].childNodes[0].nodeValue;
                displayContent.column = "diagnosis";
                displayContent.details = parseDiagnosisDetails(currentContent);

                break;
            case "risk_info":
                displayContent.column = "riskInfo";
                displayContent.details.description = currentContent.getElementsByTagName("description")[0].childNodes[0].nodeValue;
                displayContent.details.code = currentContent.getElementsByTagName("code")[0].childNodes[0].nodeValue;
                displayContent.details.name = currentContent.getElementsByTagName("name")[0].childNodes[0].nodeValue;
                displayContent.details.permanence = currentContent.getElementsByTagName("permanence")[0].childNodes[0].nodeValue;
                displayContent.details.startTime = currentContent.getElementsByTagName("start_time")[0].childNodes[0].nodeValue;
                displayContent.details.endTime = currentContent.getElementsByTagName("end_time")[0].childNodes[0].nodeValue;
                break;
            default:
                return null;
        }
    } catch (err) {
        return null;
    }

    return displayContent;
}

/**
 * @function parseSectionData
 * @description Parses the given section
 * @param {currentSection} 
 * @param {entry}
 * @returns columnMap
 */
eRAData.parseSectionData = function(currentSection, entry) {
    var contents = currentSection.getElementsByTagName("content");

    for (var k = 0; k < contents.length; k++) {

        var currentContent = contents[k];
        var displayContent = new DisplayContent(contents[k].getElementsByTagName("type")[0].childNodes[0].nodeValue, entry);
        displayContent.sectionTitle = currentSection.getElementsByTagName("code")[0].childNodes[0].nodeValue;

        displayContent = eRAData.parseContentData(currentContent, displayContent);

        if (displayContent != null) {
            displayContent.id = addCounter;

            displayContentArr.push(displayContent);

            addCounter++;

            if (displayContent.displayText != undefined) {
                if (displayContent.sectionTitle == SECTION_TITLE_CHIEF_COMPLAINT) {
                    entry.columns.get(displayContent.column).unshift(displayContent);
                }
                else {
                    entry.columns.get(displayContent.column).push(displayContent);
                }
            }
        }
    }
}

/**
 * @function parseEntryData
 * @description Parses the given entry data
 * @param {entryData} getEntries response 
 * @returns {entries}
 */
eRAData.parseEntryData = function (entryData) {
    let entries = new Set();

    for (var i = 0; i < entryData.length; i++) {
        var currentEntry = entryData[i];
        var serviceEventOid = currentEntry.getElementsByTagName("service_event_oid")[0].childNodes[0].nodeValue;

        var entry = new Entry(currentEntry.getElementsByTagName("oid")[0].childNodes[0].nodeValue);
        entry.dateTime = currentEntry.getElementsByTagName("time")[0].childNodes[0].nodeValue;
        entry.color = eRAData.getServiceEventColor(serviceEventOid);
        entry.serviceEventOid = serviceEventOid;
        entry.dataView = currentEntry.getElementsByTagName("primary_data_view")[0].getElementsByTagName("name")[0].childNodes[0].nodeValue;
        entry.organizationOid = currentEntry.getElementsByTagName("organization")[0].getElementsByTagName("oid")[0].childNodes[0].nodeValue;
        entry.organizationName = currentEntry.getElementsByTagName("organization")[0].getElementsByTagName("name")[0].childNodes[0].nodeValue;

        var entryAuthor = currentEntry.getElementsByTagName("author")[0];

        entry.author = entryAuthor.getElementsByTagName("first_name")[0].childNodes[0].nodeValue + " " +
            entryAuthor.getElementsByTagName("last_name")[0].childNodes[0].nodeValue;

        var sections = entryData[i].getElementsByTagName("section");

        for (var j = 0; j < sections.length; j++) {
            eRAData.parseSectionData(sections[j], entry);
        }

        entries.add(entry);
    }

    return entries;
};

/**
 * @function getPatientData
 * @description Queries and parses the patients data
 * @param {serviceEventOid} 
 * @param {callback} 
 * @returns callback(err, data)
 */
eRAData.getPatientData = function (oid, callback) {
    eRAData.openServiceEvent(oid, function (err, response) {
        if (err) {
            eRAData.closeServiceEvent(function (err, response) {
                callback(err, null);
            });
        }
        else {
            contextId = $(response).find("context_id").text();

            eRAData.getEntries(function (err, res) {
                var entries = res.getElementsByTagName("entry");
                let patientData = {};
                patientData.entries = eRAData.parseEntryData(entries);
                patientData.contents = displayContentArr;

                eRAData.closeServiceEvent(function (err, closeResponse) {
                    if (err) {
                        callback(err, patientData);
                    }
                    else {
                        callback(null, patientData);
                    }
                });

            });
        }
    });
}

/**
 * @function getDataToDisplay
 * @description Queries eRA and parses entries for data to display in the table view
 * @param {pSessionId} 
 * @param {pContextId} 
 * @param {callback} 
 * @returns callback(err, data)
 */
eRAData.getDataToDisplay = function(pSessionId, pContextId, callback) {
	contextId = pContextId;
	sessionId = pSessionId;

	var searchParams = eRAData.generateSearchParams();
	var serviceEvents;
	var serviceEventOid;

	eRAData.getServiceEvents(searchParams, function (err, results) {
	    if (err) {
            callback(err, null)
        }
	    else {
	        serviceEvents = eRAData.parseServiceEvents(results);

	        if (serviceEvents != null) {
	            serviceEventOid = serviceEvents[0].getElementsByTagName("oid")[0].childNodes[0].nodeValue;

                eRAData.getPatientData(serviceEventOid, function (err, contents) {
                    onDataReady(contents);
	                callback(err, contents);
	            });
	        }
	        else {
	            eRAData.createServiceEvent(function (err, oid) {
	                if (err) {
                        callback(err, null);
                    }
	                else {
	                    serviceEventOid = oid;

                        eRAData.getPatientData(serviceEventOid, function (err, contents) {
                            onDataReady(contents);                         

	                        callback(err, contents);
	                    });
	                }
	            }
            )
	        };
	    }
	});
};

/**
 * @function doTestUse
 * @description Parses test data and returns it to caller
 * @param {callback}
 * @returns void
 */
eRAData.doTestUse = function (callback) {

    $.get("misc/getEntriesVarpu.xml", function (data) {
        var entries = data.getElementsByTagName("entry");
        let patientData = {};
        patientData.entries = eRAData.parseEntryData(entries);
        patientData.contents = displayContentArr;
            
        callback(patientData);
        onDataReady(patientData);
    });

}

// PostMessage API
function onDataReady(data) {
    window.parent.postMessage({
        event: "data_ready",
        data: data
    }, window.parent.document.URL);
}