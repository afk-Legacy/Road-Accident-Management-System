const { ipcRenderer, ipcMain } = require('electron');
const mysql = require('mysql2'); 

let con;

ipcRenderer.on('init-db', function (event)
{
        con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "root",
        database: "rams"
      });
      
      con.connect(function(err) {
        if (err) throw err;
      });

      console.log("connected!");
});

function openModal(element)
{
    var tables = document.getElementsByName("tableType");
    var tableTxt;
    
    for (let i = 0; i < tables.length; i++)
    {
        if (tables[i].checked)
        {
            tableTxt = tables[i].labels[0].innerHTML;
        }
    }
    
    if ((element.id + "").includes("query-init") && (tableTxt+ "").includes("undefined"))
        return;

    ipcRenderer.send('open-modal', element.id, tableTxt);
}

function signup(element)
{
    signupDetails = new Array(4);
    userType = ""
    if (element.id == "signup-police-done")
    {
        signupDetails[0] = document.getElementById("signup-police-fname").value;
        signupDetails[1] = document.getElementById("signup-police-lname").value;
        signupDetails[2] = document.getElementById("signup-police-badge").value;
        signupDetails[3] = document.getElementById("signup-police-pass").value;
        userType = "Police";
    }
    
    else if (element.id == "signup-res-done")
    {
        signupDetails[0] = document.getElementById("signup-res-fname").value;
        signupDetails[1] = document.getElementById("signup-res-lname").value;
        signupDetails[2] = document.getElementById("signup-res-id").value;
        signupDetails[3] = document.getElementById("signup-res-pass").value;
        userType = "Researcher";
    }

    con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "root",
        database: "rams"
      });
      
    var queryTxt = "INSERT INTO user values (" + " \'" + signupDetails[2] + "\' " + ", \'" + signupDetails[3] + "\'" + ", \'" + userType + "\')";
    con.query(queryTxt, function(err, result)
    {
        console.log(queryTxt);

        if (err)
        {
            ipcRenderer.send('query-failed', err.message);
            return;
        }

        else if (result.length > 0)
        {
            ipcRenderer.send('query-failed', "User already exists.");
        }

        else 
        {
            ipcRenderer.send('query-success', "Account Created!");
            ipcRenderer.send('login', userType);
        }
    });


}

function login(element)
{

    var user = document.getElementById("id_input").value;
    var pass = document.getElementById("pass_input").value;

    con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "root",
        database: "rams"
      });

    con.query("SELECT * from user WHERE user_id=" + "\'"+ user +"\'" + " and user_pass=" + "\'"+ pass +"\'", function(err, result)
    {
        if (err)
        {
            ipcRenderer.send('query-failed', err.message);
            return;
        }

        else if (result.length == 0)
        {
            ipcRenderer.send('query-failed', "User already exists.");
        }

        else
        {
            ipcRenderer.send('login', Object.values(result[0])[2]);
        }
    });
}

function search()
{
    var keyword = document.getElementById("search-query").value;
    
    var tables = document.getElementsByName("tableType");
    var tableTxt = "";
    
    for (let i = 0; i < tables.length; i++)
    {
        if (tables[i].checked)
        {
            tableTxt = tables[i].labels[0].innerHTML;
        }
    }

    if (tableTxt.length < 1)
        return;
    
        
    getTableColumns(tableTxt, (headResult) => 
    {
        var table = document.getElementById("result-table");
        var columns = "";
        
        while (table.rows.length > 1)
            table.deleteRow(table.rows.length - 1);

        for (let i = 0; i < headResult.length; i++)
        {
            if (i == headResult.length - 1)
                columns += " " + headResult[i].Field;
            else
                columns += " " + headResult[i].Field + ", ";
        }

        columns = "(" + columns + ")";

        con = mysql.createConnection({
            host: "localhost",
            user: "root",
            password: "root",
            database: "rams"
          });
          
          con.connect(function(err) {
            if (err) throw err;
          });
          
          var searchQuery = "";

          if ((keyword + "").length < 1)
            searchQuery = "SELECT * FROM " + tableTxt;
          else
            searchQuery = "SELECT * FROM " + tableTxt + " WHERE " + "\'" + keyword + "\'" + " IN " + columns;
          
            con.query(searchQuery, function (err, rowResult)
          {
                  if (err) throw err;
                  
                  for (let i = 0; i < rowResult.length; i++)
                  {
                      var row = Object.values(rowResult[i]);
                      var tableRow = table.insertRow();
                      tableRow.className = "active-row";
                      for (let j = 0; j < row.length; j++)
                      {
                          var cell = tableRow.insertCell();
                          cell.innerHTML = row[j];
                      }
                  }
          });
    })

}
function onClickAddRecord()
{
    var fields = document.getElementsByClassName("crud-box");
    var fieldsData = new Array();
    var queryStr = "";

    var btn = document.getElementsByClassName("submit-button");
    var table = (btn[0].id + "").split("-")[0] + "";

    for (let i = 0; i < fields.length; i++)
    {
        fieldsData.push(fields[i].value);
    }

    let intMod = 0;

    switch(table)
    {
        case 'accident':
            intMod = 1;
            break;

        case 'passenger':
            intMod = 3;
            break;

        case 'person':
            intMod = 1;
            break;

        case 'vehicle':
            intMod = 2;
            break;

        case 'accidentvehicle':
            intMod = 2;
            break;

        default:
            break;
    }

    for (let i = 0; i < fieldsData.length; i++)
    {
        if (i == fieldsData.length - 1)
        {
            if (intMod > 0)
            {
                queryStr += " " + fieldsData[i];
                intMod -= 1;
            }
            else
                queryStr += " " + "\'" + fieldsData[i] + "\'";
        }
        else
            {
                if (intMod > 0)
            {
                queryStr += " " + fieldsData[i] + " ,";
                intMod -= 1;
            }
            else
                queryStr += " " + "\'" + fieldsData[i] + "\'" + " ,";
            }

            console.log(queryStr);
    }

    queryStr = "INSERT INTO " + table + " VALUES ( " + queryStr + " ) ";

    con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "root",
        database: "rams"
      });
      
      con.connect(function(err) {
        if (err) throw err;
      });

    con.query(queryStr, function (err, result)
        {
            if (err)
                ipcRenderer.send('query-failed', err.message);
            else 
                ipcRenderer.send('query-success', "ADD Success!");
        });

}

function onClickUpdateRecord()
{
    var fields = document.getElementsByClassName("crud-box");
    var fieldsData = new Array();

    var btn = document.getElementsByClassName("submit-button");
    var table = (btn[0].id + "").split("-")[0] + "";

    for (let i = 0; i < fields.length; i++)
    {
        fieldsData.push(fields[i].value);
    }
    
    let intMod = 0;

    switch(table)
    {
        case 'accident':
            intMod = 1;
            break;

        case 'passenger':
            intMod = 3;
            break;

        case 'person':
            intMod = 1;
            break;

        case 'vehicle':
            intMod = 2;
            break;

        case 'accidentvehicle':
            intMod = 2;
            break;
            
        default:
            break;
    }

    getTableColumns(table, (result) =>
    {
        var whereClause = " WHERE ";
        const total_keys = intMod;

        for (let i = 0; i < total_keys; i++)
        {
            if (i == total_keys - 1)
            {
                whereClause += result[i].Field + "=" + fieldsData[i];
            }
            else
            {
                whereClause += result[i].Field + "=" + fieldsData[i] + " and ";
            }

            intMod -= 1;
        }

        var setClause = " SET ";

        for (let i = 0; i < fieldsData.length - total_keys; i++)
        {
            if (i == (fieldsData.length - total_keys) - 1)
                setClause += result[(total_keys) + i].Field + "=" + "\'" + fieldsData[total_keys + i] + "\'";
            else
                setClause += result[(total_keys) + i].Field + "=" + "\'" + fieldsData[total_keys + i] + "\'" + ", ";
        }

        console.log("UPDATE " + table + setClause + whereClause);

        con = mysql.createConnection({
            host: "localhost",
            user: "root",
            password: "root",
            database: "rams"
          });
          
        con.query("UPDATE " + table + setClause + whereClause, function (err, result)
        {
            if (err)
                ipcRenderer.send('query-failed', err.message);
            else 
                ipcRenderer.send('query-success', "UPDATE Success!\nRows updated: " + result.affectedRows);
        });
    });
}

function onDeleteRecord()
{
    var fields = document.getElementsByClassName("crud-box");
    var fieldsData = new Array();

    var btn = document.getElementsByClassName("submit-button");
    var table = (btn[0].id + "").split("-")[0] + "";

    for (let i = 0; i < fields.length; i++)
    {
        fieldsData.push(fields[i].value);
    }
    
    let intMod = 0;

    switch(table)
    {
        case 'accident':
            intMod = 1;
            break;

        case 'passenger':
            intMod = 3;
            break;

        case 'person':
            intMod = 1;
            break;

        case 'vehicle':
            intMod = 2;
            break;

        case 'accidentvehicle':
            intMod = 2;
            break;
            
        default:
            break;
    }

    getTableColumns(table, (result) =>
    {
        var whereClause = " WHERE ";
        const total_keys = intMod;

        for (let i = 0; i < total_keys; i++)
        {
            if (i == total_keys - 1)
            {
                whereClause += result[i].Field + "=" + fieldsData[i];
            }
            else
            {
                whereClause += result[i].Field + "=" + fieldsData[i] + " and ";
            }

            intMod -= 1;
        }

        console.log("DELETE FROM " + table + whereClause)

        con = mysql.createConnection({
            host: "localhost",
            user: "root",
            password: "root",
            database: "rams"
          });
          
        con.query("DELETE FROM " + table + whereClause, function (err, result)
        {
            if (err)
                ipcRenderer.send('query-failed', err.message);
            else 
                ipcRenderer.send('query-success', "DELETE Success!\nRows updated: " + result.affectedRows);
        });
    });
}
function getTableColumns(tableName, callback)
{

    con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "root",
        database: "rams"
      });


    con.query("SHOW COLUMNS FROM " + tableName, function (err, headResult) {
        if (err) throw err;
        
        return callback(headResult);
    });
}

function onChooseTable(element)
{
    var table = document.getElementById("result-table");

    while (table.rows.length > 0)
        table.deleteRow(table.rows.length - 1);
        
    var row = table.insertRow();
    row.className = "styled-header";

    getTableColumns(element.textContent, (headResult) =>
    {
        for (let i = 0; i < headResult.length; i++)
        {
            var cell = row.insertCell(i);
            cell.innerHTML = headResult[i].Field;
        }
    });

    con.query("SELECT * FROM " + element.textContent, function (err, rowResult)
    {
            if (err) throw err;
            
            for (let i = 0; i < rowResult.length; i++)
            {
                var row = Object.values(rowResult[i]);
                var tableRow = table.insertRow();
                tableRow.className = "active-row";
                for (let j = 0; j < row.length; j++)
                {
                    var cell = tableRow.insertCell();
                    cell.innerHTML = row[j];
                }
            }
    });
    

}