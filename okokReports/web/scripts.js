var FeedbackTable = []
var currentWindowID, currentWindow
var windowStatus = "closed"
var closeKey = "27"

window.addEventListener('message', function(event) {
	switch (event.data.action) {
		case 'ClientFeedback':
			windowStatus = "feedback"
			$(".feedback").fadeIn()
			break
		case 'OpenAdminFeedback':
			$(".feedbackWindow").hide()
			windowStatus = "FeedbackTable"
			$(".feedbackWrapper").fadeIn()
			$(".feedbackTable").show()
			break
		case 'updateFeedback':
			FeedbackTable = event.data.FeedbackTable
			reloadFeedbackTable()
			break
	}
});

function checkIfEmpty() {
	if(document.getElementById("feedback_subject-input").value === "" || document.getElementById("feedback_information-input").value === "") {
		document.getElementById('submitFeedback').disabled = true;
	} else { 
	document.getElementById('submitFeedback').disabled = false;
	}
}

$(document).on('click', "#submitFeedback", function() {
	var category = $("input[name='category']:checked").val()
	var subject = $("#feedback_subject-input").val()
	var information = $("#feedback_information-input").val()

	$(".feedback").fadeOut();

	$.post('https://okokReports/action', JSON.stringify({
		action: "newFeedback",
		subject: subject,
		information: information,
		category: category,
	}));

	cleanFeedback();
	document.getElementById("submitFeedback").disabled = true;  

	windowStatus = "closed"
});

function cleanFeedback() {
	$("#feedback_subject-input").val("");
	$("#feedback_information-input").val("")
}

$(document).on('click', ".closeFeedback", function() {
	$(".feedback").fadeOut();

	$.post('https://okokReports/action', JSON.stringify({
		action: "close",
	}));

	cleanFeedback();

	windowStatus = "closed"
});

$(document).on('click', ".closeFeedbackWindow", function() {
	$(".feedbackWindow").hide();
	$(".feedbackTable").show();

	windowStatus = "FeedbackTable"
})

$(document).on('click', ".closeFeedbackTable", function() {
	$(".feedbackWrapper").fadeOut();
	$.post('https://okokReports/action', JSON.stringify({
		action: "close",
	}));

	windowStatus = "closed"
});

function viewFeedbackWindow(feedbackid) {
	currentWindowID = feedbackid
	$(".feedbackTable").hide();
	var feedbackW = $(".feedbackWindow");
	var data = FeedbackTable[feedbackid]
	currentWindow = data
	feedbackW.show();
	feedbackW.find(".feedback_id").html(`${data.feedbackid}`)
	feedbackW.find(".player_id").html(`${data.playerid}`)
	feedbackW.find(".player_identifier").html(`${data.identifier}`)
	var feedbackWcard = feedbackW.find(".card-body")
	feedbackWcard.find(".feedback_subject").val(`${data.subject}`)
	feedbackWcard.find(".feedback_information").html(`${data.information}`)

	if (data.category === 'player_report') {
		feedbackWcard.find(".feedback_category").html(`<span><i class="fas fa-user-alt"></i> PLAYER REPORT</span>`)
	} else if (data.category === 'question') {
		feedbackWcard.find(".feedback_category").html(`<span><i class="fas fa-question"></i> QUESTION</span>`)
	} else {
		feedbackWcard.find(".feedback_category").html(`<span><i class="fas fa-bug"></i> BUG</span>`)
	}
}

$(document).on('click', ".table-row .btn-view", function() { 
	var feedbackid = $(this).parent().parent().attr("feedbackID")
	viewFeedbackWindow(feedbackid)

	windowStatus = "viewFeedback"
});

$(document).on('click', ".feedbackWindow .btn-goback", function() { 
	$(".feedbackWindow").hide();
	$(".feedbackTable").show();

	windowStatus = "FeedbackTable"
});

$(document).on('click', ".btn-assist", function() { 
	$(".feedbackWrapper").fadeOut();
	$.post('https://okokReports/action', JSON.stringify({
		action: "assistFeedback",
		feedbackid: currentWindow.feedbackid
	}));

	windowStatus = "closed"
});

$(document).on('click', ".btn-conclude", function() { 
	ConcludeFeedback(currentWindow.feedbackid, false)
	$(".feedbackWindow").hide();
	$(".feedbackTable").show();

	windowStatus = "FeedbackTable"
});

function ConcludeFeedback(feedbackid, canConclude) {
	$.post('https://okokReports/action', JSON.stringify({
		action: "concludeFeedback",
		feedbackid: feedbackid,
		canConclude: canConclude
	}));
}

$(document).ready(function(){
	document.onkeyup = function(data) {
		if (data.which == closeKey) {
			switch (windowStatus) {
				case 'feedback' :
					cleanFeedback();
					$(".feedback").fadeOut()
					$.post('https://okokReports/action', JSON.stringify({
						action: "close",
					}));
					windowStatus = "closed"
					break
				case 'FeedbackTable' :
					$(".feedbackWrapper").fadeOut()
					$.post('https://okokReports/action', JSON.stringify({
						action: "close",
					}));
					windowStatus = "closed"
					break
				case 'viewFeedback' :
					$(".feedbackWindow").hide()
					$(".feedbackTable").show()
					windowStatus = "FeedbackTable"
				break
			}
		}
	};
});

function reloadFeedbackTable() {
	var feedbackTable = $(".feedbackTable").find(".table")

	FeedbackTable.sort(function(a, b) { 
		return a.feedbackid - b.feedbackid
	})

	feedbackTable.html("");

	$.each(FeedbackTable, function(id, feedback) {
		var category = ""
		var concluded =  "<span><i class='fas fa-times-circle'></i></span>"
		var statusColor = "#bd2e24"
	
		if (feedback.category === 'player_report') {
			category = "<span><i class='fas fa-user-alt'></i> PLAYER REPORT</span>"
		} else if (feedback.category === 'question') {
			category = "<span><i class='fas fa-question'></i> QUESTION</span>"
		} else {
			category = "<span><i class='fas fa-bug'></i> BUG</span>"
		}

		if (feedback.concluded === "assisting") {
			concluded = "<span><i class='fas fa-hands-helping'></span>"
			statusColor = "#00b357"
		}

		if (feedback.concluded != true) {
			feedbackTable.append(`
				<tr class="table-row" feedbackID="${id}">
					<td>FEEDBACK #${feedback.feedbackid}</th>
					<td>${category}</td>
					<td style="color: ${statusColor};">${concluded}</td>
					<td><button type="button" class="btn btn-view"><i class="fas fa-eye"></i> VIEW</button></td>
				</tr>`
			)
		}
	});

	if ($(".feedbackTable .table").children().length <= 0) {
		$(".feedbackTable .feedback_subtitle").html("NICE JOB! YOU CAN NOW RELAX AND TAKE A SIP.");
		$(".feedbackTable .card-header").css('border-bottom', 'none');
		$(".feedbackTable .card-header").css('border-bottom-left-radius', '10px');
		$(".feedbackTable .card-header").css('border-bottom-right-radius', '10px');
		$(".feedbackTable .card-body").hide(); 
	} else {
		$(".feedback_subtitle").html("HEY! IT LOOKS LIKE YOU HAVE SOME WORK TO DO...");
		$(".feedbackTable .card-header").css('border-bottom', '1px solid #fff');
		$(".feedbackTable .card-header").css('border-bottom-left-radius', '0');
		$(".feedbackTable .card-header").css('border-bottom-right-radius', '0');
		$(".feedbackTable .card-body").show();
	}
}