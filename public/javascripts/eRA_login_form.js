jQuery.support.cors = true;
var EDEMO_URL = "https://erasmartcard.ehoito.fi:44304/Forward/Demo6";
var version;
var systemId;
var organizationId;
var loginVariables;
var loginUrl = "";
var loginEventId = "";
var currentStatus = "101";
var registrationNumber = "";
var sessionId = "";
var newWindow;
var loggedOut = true;
var patientOpened = false;
var idNumber = "";
var firstName = "";
var lastName = "";
var isDead = "";

// Login to eRA
$("#loginButton").click(function () {
	version = "2.0";
	systemId = $("#systemIdInput").val();
	organizationId = $("#organizationIdInput").val();
	registrationNumber = $("#registrationNumberInput").val();
	
	loginVariables = "<request><interface_version>" + version + "</interface_version><system_id>" + systemId + "</system_id><smart_card_login><redirect><on_login_success></on_login_success><on_login_failure></on_login_failure><on_unlock_failure></on_unlock_failure></redirect></smart_card_login></request>";
	
	$.ajax({
		type: "POST",
		url: EDEMO_URL + "/User/SmartCardLogin/",
		dataType: "xml",
		contentType: "application/xml",
		data: loginVariables,
		success: function (result, textStatus, jqXHR) {
			loggedOut = false;
			loginPostSuccess(result);
		},
		error: function (jqXHR,textStatus,errorThrown) {
			validateLogin();
		}
	});
	
});

// Login started successfully
function loginPostSuccess(result) {
	loginUrl = $(result).find("login_url").text();
    loginEventId = $(result).find("login_event_id").text();
    
    try {
        newWindow = window.open(loginUrl, '_blank', false);
        newWindow.focus();
    }
    catch (err) {
        alert("Salli ponnahdusikkunat ja kirjaudu sisään uudelleen");    
    }

	$(newWindow.document).ready(function() {
		getStatus();
	});
}

// Get session status
function getStatus() {
	if (loginUrl != "") {
		$.ajax({
			type: "POST",
			url: EDEMO_URL + "/Session/Status/",
			dataType: "xml",
			contentType: "application/xml",
			data: "<request><session_id></session_id><login_event_id>" + loginEventId + "</login_event_id></request>",
			success: function (result, textStatus, jqXHR) {
				getStatusCode(result);
			},
			error: function (jqXHR,textStatus,errorThrown) {
				validateLogin();
			}
		});
	}
}

// Get session status when unlocking
function getStatusUnlock() {
	$.ajax({
		type: "POST",
		url: EDEMO_URL + "/Session/Status/",
		dataType: "xml",
		contentType: "application/xml",
		data: "<request><session_id>" + sessionId + "</session_id><login_event_id></login_event_id></request>",
		success: function (result, textStatus, jqXHR) {
			getStatusCodeUnlock(result);
		},
		error: function (jqXHR,textStatus,errorThrown) {
			killSession();  
		}
	});
}

// Check resulting status code 
function getStatusCode(result) {
	currentStatus = $(result).find("code").text();
	if (currentStatus == "102") {
		validateLogin();
	}
	else if(currentStatus == "300" || currentStatus == "303") {
		alert("Sisäänkirjautuminen umpeutui");
	}
	else if(currentStatus == "304")
	{
		alert("Sisäänkirjautuminen peruttiin");
	}
	else {
		setTimeout(getStatus(), 3000);
	}
}

// Check resulting status code when unlocking
function getStatusCodeUnlock(result) {
	currentStatus = $(result).find("code").text();

	if (currentStatus == "200") {
	}
	else if(currentStatus == "201") {
		setTimeout(getStatusUnlock(), 3000);
	}
	else {
		killSession();
	}
}

// Validate successful login or check error code
function validateLogin() {
	validateVariables = "<request><system_id>" + systemId + "</system_id><smart_card_login_validate><login_event_id>" + loginEventId + "</login_event_id></smart_card_login_validate></request>";
	$.ajax({
		type: "POST",
		url: EDEMO_URL + "/User/SmartCardLoginValidate/",
		dataType: "xml",
		contentType: "application/xml",
		data: validateVariables,
		success: function (result, textStatus, jqXHR) {
			validatePostSuccess(result);
		},
		error: function (jqXHR, textStatus, errorThrown) {
			var responseXml = jqXHR.responseText;
			var test = jqXHR.responseXml;

			alert("Sisäänkirjautumisvirhe: " + $(responseXml).find("message").text());
		}
	});
}

// Validation was successful, start confirm
function validatePostSuccess(result) {
	registrationNumber = $(result).find("registration_number").text();
	confirmLogin();
}

// Confirm the login
function confirmLogin() {
	confirmVariables = "<request><system_id>" + systemId + "</system_id><smart_card_login_confirm><login_event_id>" + loginEventId + "</login_event_id><user><registration_number>" + registrationNumber + "</registration_number><organization_unit><id>" + organizationId + "</id></organization_unit></user></smart_card_login_confirm></request>";
	$.ajax({
		type: "POST",
		url: EDEMO_URL + "/User/SmartCardLoginConfirm/",
		dataType: "xml",
		contentType: "application/xml",
		data: confirmVariables,
		success: function (result, textStatus, jqXHR) {
			confirmPostSuccess(result);
		},
		error: function (jqXHR, textStatus, errorThrown) {

		}
	});
}

// Confirm was successful, save session id
function confirmPostSuccess(result) {
	sessionId = $(result).find("session_id").text();
}

// Kill the session
function killSession() {
	systemId = $("#systemIdInput").val();
	organizationId = $("#organizationIdInput").val();
	registrationNumber = $("#registrationNumberInput").val();

	killSessionVariables = "<request><interface_version>2.0</interface_version><system_id>" + systemId + "</system_id>" +
					"<kill_session><registration_number>" + registrationNumber + "</registration_number></kill_session></request>";
	$.ajax({
		type: "POST",
		url: EDEMO_URL + "/Session/Kill/",
		dataType: "xml",
		contentType: "application/xml",
		data: killSessionVariables,
		success: function (result, textStatus, jqXHR) {
			loginUrl = "";
			loginEventId = "";
			currentStatus = "101";
			registrationNumber = "";
			sessionId = "";
			loggedOut = true;
		},
		error: function (jqXHR, textStatus, errorThrown) {
		}
	});
}

// Logout
function logout() {
	logoutVariables = "<request><system_id>" + systemId + "</system_id><session_id>" + sessionId + "</session_id></request>";
	$.ajax({
		type: "POST",
		url: EDEMO_URL + "/User/Logout/",
		dataType: "xml",
		contentType: "application/xml",
		data: logoutVariables,
		success: function (result, textStatus, jqXHR) {
			loginUrl = "";
			loginEventId = "";
			currentStatus = "101";
			registrationNumber = "";
			sessionId = "";
			loggedOut = true;
		},
		error: function (jqXHR, textStatus, errorThrown) {
			killSession();
		}
	});
}

// Begin logout
$("#logoutButton").click(function () {
    if (patientOpened) {
        closePatient(function () {
            logout();
        });
    }
    else {
        logout();
    }

    if (newWindow) {
        newWindow.close();
    }

});

// Begin open patient
$("#openPatientButton").click(function () {
    if (!loggedOut) {
        if (patientOpened) {
            closePatient(function () {
                openPatient();
            });
        }
        else {
            openPatient();
        }
    }
    else {
        alert("Et ole kirjautunut sisään");
    }

});

// Begin close patient
$("#closePatientButton").click(function () {
    if (!loggedOut) {
        closePatient();
    }

});

// Do test use
$("#testUseButton").click(function () {
    var timeline = parent.document.getElementById("timelineForm");

    parent.postMessage({ event: "test_use" }, document.URL);
    timeline.contentWindow.postMessage({ event: "test_use" }, document.URL);  
});

/********************************
*
* Patient functions
*
*********************************/

function openPatient() {
	idNumber = $("#idNumberInput").val();
	firstName = $("#firstNameInput").val();
	lastName = $("#lastNameInput").val();
	isDead = $("#isDeadInput").val();
	patientOpenVariables = "<request>" +
					  "<session_id>" + sessionId + "</session_id>" +
					  "<open_patient>" +
						"<patient>" +
						  "<id_type>permanent</id_type>" +
						  "<id>" + idNumber + "</id>" +
						  "<id_creation_year></id_creation_year>" +
						  "<date_of_birth></date_of_birth>" +
						  "<gender></gender>" +
						  "<pms_id></pms_id>" +
						  "<first_name>" + firstName + "</first_name>" +
						  "<friendly_name></friendly_name>" +
						  "<last_name>" + lastName + "</last_name>" +
						  "<is_dead>" + isDead + "</is_dead>" +
						  "<preferred_language></preferred_language>" +
						  "<mobile_phone_number></mobile_phone_number>" +
						  "<municipality_code></municipality_code>" +
						  "<address>" +
							"<street_address></street_address>" +
							"<postal_code></postal_code>" +
							"<city></city>" +
						  "</address>" +
						"</patient>" +
						"<authoring_settings>" +
						  "<mode>default</mode>" +
						  "<other_person_id></other_person_id>" +
						  "<supervisor_id></supervisor_id>" +
						  "<dictation_recording_time></dictation_recording_time>" +
						"</authoring_settings>" +
						"<registry_settings>" +
						  "<access_model>default</access_model>" +
						  "<occupational_healthcare_client_id></occupational_healthcare_client_id>" +
						"</registry_settings>" +
					  "</open_patient>" +
					"</request>";
	$.ajax({
		type: "POST",
		url: EDEMO_URL + "/Patient/Open/",
		dataType: "xml",
		contentType: "application/xml",
		data: patientOpenVariables,
		success: function (result, textStatus, jqXHR) {
			contextId = $(result).find("context_id").text();

			patientOpened = true;

			var timeline = parent.document.getElementById("timelineForm");
			timeline.contentWindow.postMessage(
				{
					event: "patient_open",
					sessionId: sessionId,
					contextId: contextId
				}, document.URL);
		},
		error: function (jqXHR, textStatus, errorThrown) {

		}
	});
}

function closePatient(callback) {
	patientCloseVariables = "<request><session_id>" + sessionId + "</session_id></request>";
	$.ajax({
		type: "POST",
		url: EDEMO_URL + "/Patient/Close/",
		dataType: "xml",
		contentType: "application/xml",
		data: patientCloseVariables,
		success: function (result, textStatus, jqXHR) {
			patientOpened = false;
			callback();
		},
		error: function (jqXHR,textStatus,errorThrown) {
			callback();
		}
	});
}			