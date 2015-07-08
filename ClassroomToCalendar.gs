function ClassroomToCalendar() {
  //Get E-Mail
  var label = GmailApp.getUserLabelByName("Classroom");
  var threads = label.getThreads(); 
  //check there are actually messages in the Gmail tagged with Classroom
  if (threads.length > 0 ) {
  
    //there are messages threads so process them
    for (var i = 0; i < threads.length; i++) {
      
      //there a messages in the threads so process them
      var messages=threads[i].getMessages();  
      for (var j = 0; j < messages.length; j++) {
        
        //read the contents of the email.
        var message=messages[j];
        var subject=message.getSubject();
        var regex1=/New assignment: (.*)/
        var title=regex1.exec(subject);
        var title1=title[1];
        title1 = title1.replace(/['"]+/g, '');
        var body=message.getBody();
        var regex2=/Due: (......)/
        var due=regex2.exec(body);
        var deadline=due[1];
        var regex3=/Instructions:<br>\n(.*)<br>/
        var inst=regex3.exec(body);
        var instruct=inst[1];
        var body2=message.getPlainBody();
        var regex4=/(https?:\/\/).*/
        var web1=regex4.exec(body2);
        var web2=web1[0];
        var teacher=message.getFrom();
        var regex5=/(.*)<no-reply/
        var teacher1=regex5.exec(teacher); 
        var teacher2=teacher1[1];
        var detail=instruct + " for your teacher: " + teacher2 + "\n" + "\n" +web2 ;
        var classroomname = body.substr(0, body.indexOf(' has')); 
        
       
        //parse the start date correctly for the year and month
        if (deadline != "") 
        {
            var stringStartDate = String(deadline);
            var calSplit = stringStartDate.split(" ");
            var calDay = calSplit[0]; //set the day for the calendar
            var calMonth = calSplit[1].substring(0,3); //read the three letter month and remove the last character "<"
    
            var calDayVal = parseInt(calDay);  //get the day as a value
            var calMonthVal = giveMonthValue(calMonth); //use the function to get the month
            var calYear = getCalendarYear(calDayVal, calMonthVal);  //calculate the correct year        
            deadline = calDay + " " + calMonth + ", " + calYear;
        }
        
        //Add to Spreadsheet
        var my_ss = "Classroom Assignments";
        var files = DriveApp.getFilesByName(my_ss);
        var file = !files.hasNext() ? SpreadsheetApp.create(my_ss) : files.next();
        var ss = SpreadsheetApp.openById(file.getId())
        try 
        {
          ss.setActiveSheet(ss.getSheetByName(my_sheet));
        } catch (e){;} 
        var sheet = ss.getActiveSheet();
        sheet.appendRow([deadline,title1,classroomname,web2,instruct,teacher2,"Not Written"]);
      }
    }
    //finished reading all the items and adding them to the spreadsheet.
        
    //Add all outstanding items in the Spreadsheet to the Calendar
    var EVENT_IMPORTED = "AddedToCalendar";
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var startRow = 1;  
    var numRows = 10000;   
    var dataRange = sheet.getRange(startRow, 1, numRows, 7)
    var data = dataRange.getValues();
    for (var i = 0; i < data.length; ++i) 
    {
      var row = data[i];
      var title = row[1]; 
      var startDate = row[0];
      var classroomname = row[2];
      var instructions = row[4];  
      var url = row[3]
      var teacher3 = row[5];
      var details = instructions + "\n" + url + "\n" + "Issued by Teacher: " + teacher3;
      var eventImported = row[6];
      if (eventImported  != EVENT_IMPORTED && title != "") 
      {        
         var cal = CalendarApp.getDefaultCalendar();
         cal.createAllDayEvent((classroomname + " - " + title), new Date(startDate),{description:detail});
         sheet.getRange(startRow + i, 7).setValue(EVENT_IMPORTED);
         SpreadsheetApp.flush();  
      }
    }
    //The calendar is now updated

    // remove the label "Classroom" from the all threads in the inbox
    var label = GmailApp.getUserLabelByName("Classroom");
    var threads = GmailApp.getInboxThreads();
    label.removeFromThreads(threads);
  }  
}

function giveMonthValue(month) {
  
  var d = Date.parse(month + "1, 2015");
   if(!isNaN(d)){
      return new Date(d).getMonth() + 1;
   }
   return -1;
 }

function getCalendarYear(calDayVal, calMonthVal) {
 
    //get the number values for today
    var today = new Date();
    var calTodayDayVal = today.getDate();
    var calTodayMonthVal = today.getMonth()+1;
    var calTodayYearVal = today.getFullYear();
  
    //if the month in the cal is before the month today (i.e 1 < 12 ) then it's next year!
    if (calMonthVal < calTodayMonthVal) {
    //next year
      return calTodayYearVal +1;
    } 
    else if  (calMonthVal > calTodayMonthVal) {
      return calTodayYearVal;
    }
  
    else 
    //check this isn't the same month a year ahead, compare dates
    {

      //if the day is before today then it's next year!
      if (  calDayVal < calTodayDayVal ) {
        return calTodayYearVal +1;
      } else {
      // it's this year if it is today onwards
        return calTodayYearVal;
      }
    }
}
