/*jslint plusplus: true*/


/*UI setup*/


var bericht_versie = {}; 

/*huidige datum in het formaat dat gebruikt wordt in de berichten*/

function todaysDate(){

    var today = new Date(), 
        dd = today.getDate(),
        mm = today.getMonth()+1, //January is 0!
        yyyy = today.getFullYear();

    if(dd<10) {
        dd='0'+dd
    } 

    if(mm<10) {
        mm='0'+mm
    } 

    today = yyyy + mm + dd 

    return today; 
    
}
    

function capitalizeFirst(string) {
    "use strict";
    string = string.toLowerCase();
    return string.charAt(0).toUpperCase() + string.slice(1);
}
    

var padding = new Array(256).join(' ');
    
function createPaddedString(input, totalLength) {
    "use strict";
    
    if (input === undefined) {input = ""; }
    var inputLength = input.length;
    
    if (input < totalLength) {return input; }
    
    return (input + padding).substring(0, totalLength);
}
    
    

    
/*Als de versie van het bericht bekend is, kan het bericht verder uitgelezen worden*/
function inlezen_standaard(versie, bericht) {
    "use strict";
    
    var bericht_verwerkt = [],
        bestand = versie.code_EI_bericht + "_" + versie.versie_EI_standaard + ".txt",
        i = 0,
        j = 0;
    

    d3.tsv(bestand, function (error, standaard) {
        
        console.log(standaard); 
            

            
        /*Hier wil ik het bericht als het ware samenvoegen met de
        berichtstandaard. Dat wil zeggen, de lange strings moeten worden
        gesplitst op de door de standaard gespecificeerde plekken en in arrays worden 
        opgeslagen. Deze arrays kunnen dan de basis zijn voor een lijst van alle
        velden en hun waarde */

        /*Eerst de berichtstaandaard nesten op grond van de recordcode*/
        standaard = d3.nest()
            .key(function (d) { return d.Recordcode; })
            .key(function (d) { return d["Naam gegevenselement"]; })
            .entries(standaard);

            
        /*Dan door het declaratiebericht loopen en de betreffende standaard zoeken voor 
        elke regel*/
        for (i = 0; i < bericht.length; i++) {
                
            var record = bericht[i],
                /*recordcode van deze regel*/
                recordcode = record.code,
                /*Een schone kopie van het object standaard maken*/
                nieuwe_standaard = JSON.parse(JSON.stringify(standaard)),
                /*Dan de betreffende recordcode filteren uit de berichtstandaard*/
                recordcodelijst = nieuwe_standaard.filter(function (d) {return d.key === recordcode; }),
                /*We hebben alleen het values object nodig*/
                codelijst = recordcodelijst[0];

                
            /*Nadat de recordcode is bepaald en de standaard voor die recordcode is gepakt
            De standaard gebruiken om het record uit elkaar te trekken*/

            for (j = 0; j < codelijst.values.length; j++) {

                var eind = +codelijst.values[j].values[0].Eindpositie,
                    lengte = +codelijst.values[j].values[0].Lengte,
                    waarde_veld = record.bericht.substring((eind - lengte), eind),
                    berichtlijst = codelijst;
                
                berichtlijst.values[j].waarde_origineel = waarde_veld;
/*                berichtlijst.values[j].volgorde = waarde_veld + "_" + i + "_" + j;*/

            }

            bericht_verwerkt.push(berichtlijst);

        }
            
            
            
            
        /*Dan de verwerkte data gebruiken om een lijst te maken van alle waarden*/
        var lijst_records = d3.select("#veldlijst")
                                .selectAll("li")
                                .data(bericht_verwerkt)
                                .enter().append("li")
                                .attr("class", "records")
                                .text(function (d) {return d.values[0].values[0].Recordnaam; })
                                .on("click", expand);
            
        var lijst_itemvelden = lijst_records
                                .append("ul")
                                .attr("class", "itemlist")
                                .classed("collapsed", true)
                                .selectAll("li")
                                .data(function (d) {return d.values; })
                                .enter()
                                .append("li")
                                .attr("class", "items")
                                .attr("id", function (d, i) {return "id_" + d.values[0].Volgnummer + "_" + i;});
                                
            
        var item_titels = lijst_itemvelden
                            .append("div")
                            .attr("class",  "titlediv")
                            .append("span")
                            .attr("class", "itemtitle")
                            .text(function (d) {return capitalizeFirst(d.key); })
                            .append('img')
                            .attr('class', 'picture')
                            .attr('src', "images/open-iconic/svg/info.svg");
            
        var item_waardedivs = lijst_itemvelden
                                .append("div")
                                .attr("class", "waardediv");

            
        var item_waardes = item_waardedivs
                            .append("span")
                            .attr("class", "item_waarde")
                            .text(function (d) {return d.waarde_origineel; }); 

        var item_input = item_waardedivs
                            .append("input")
                            .attr("class", "item_input");
            
    });




}
 



    
function inlezen_bericht() {
    "use strict";
    /*Tekst ophalen uit het input veld en splitsen op regeleinden*/
    var bericht_gelezen = document.getElementById("inputarea").value.split("\n");


/*    Het eerste dat moet gebeuren is de berichtversie achterhalen. 
    Deze staat gelukkig altijd op dezelfde plek in het bericht*/
    bericht_versie = {kenmerk_record: bericht_gelezen[0].substring(0, 2),
                      code_EI_bericht: bericht_gelezen[0].substring(2, 5),
                      versie_EI_standaard: bericht_gelezen[0].substring(5, 7), 
                      subversie_EI_standaard: bericht_gelezen[0].substring(7, 9)};
    
    
    /*Het bericht alvast voorbewerken door aan elke regel een veld in de array
    toe te voegen waar de recordcode in staat*/
    bericht_gelezen = bericht_gelezen.map(function (d) {
        return {
            code: d.substring(0, 2),
            bericht: d
        };
    });
    
    /*Eventuele lege regels verwijderen*/
    bericht_gelezen = bericht_gelezen.filter(function (d) {return d.code !== ""; });

    
    /*Functie aanroepen om op basis van de berichtstandaard het bericht verder te verwerken*/
    inlezen_standaard(bericht_versie, bericht_gelezen);
    
    /*knop inlezen verbergen en gebruiker vragen wat ie wil*/
    $("#submit").hide();
    $("#choose").show();
    $("#credit").show();
    
    $("#berichtkop").text("Wat wil je doen?");
    
    
}
   

function bericht_maken(bron) {
    "use strict";

    
    var bericht = [],
        n = bron.length,
        i = 0,
        j = 0;
    
    for (i = 0; i < n; i++) {
        
        var bericht_record = [],
            bron_record = bron[i][0],
            n_bron = bron_record.length,
            regeleinde = "\r\n";
        
        console.log("record in eerste loop", bron_record);
        console.log("lengte record", n_bron);
        
        for (j = 0; j < n_bron; j++) {
          
            var item_record = bron_record[j],
                item_stringLength = item_record.Lengte;
            
            /*Check of er een correctiewaarde is toegevoegd,
            zo niet, dan originele waarde gebruiken*/
            
            var itemString = null;
            if (item_record.Correctie.length === 0) {itemString = item_record.Vulling; }
            if (item_record.Correctie.length > 0) {itemString = item_record.Correctie; }
            
            itemString = createPaddedString(itemString, item_stringLength);
            
            bericht_record.push(itemString);
        
        }
        
        /*Elke regel moet eindigen met een regeleinde*/
        bericht_record.push(regeleinde);
        bericht.push(bericht_record.join(""));
    }


    bericht = bericht.join("");
        
    bericht_downloaden(bericht);
}
    
    
function correcties_uitlezen() {
    "use strict";
    var selectie = d3.selectAll(".itemlist").selectAll(".item_input"),
        uitgelezen = [],
        i = 0,
        j = 0;
    
    for (i = 0; i < selectie.length; i++) {
        
        var n = selectie[i].length,
            temp = [];
        
        for (j = 0; j < n; j++) {
            var data_origineel = selectie[i][j].parentNode.__data__,
                standaard = data_origineel.values[0],
                Vulling = data_origineel.waarde_origineel,
                correctie = selectie[i][j].value;

            
            standaard.Vulling = Vulling;
            standaard.Correctie = correctie;
            
            temp.push(standaard);
        }
        
        uitgelezen.push([temp]);
    }


    
    bericht_maken(uitgelezen);
    
    
    
}

    
function bericht_downloaden(tekst_bericht) {
    "use strict";

        console.log("Zitten we op IE?")   

    
    var textFile = null,
    
        makeTextFile = function (text) {
            
            
            /*Blobfunctie beschikbaar?*/
            if (!window.Blob) {
            console.log("Blob niet beschikbaar");
            return;
            }
    
            /*Anders nu blob maken*/
            var blobObject = new Blob([text], {type: 'text/plain'});
            
            /*Als IE en versie groter dan 10, dan IE methode gebruiken om download te maken*/
            
            if (window.navigator.msSaveOrOpenBlob) {
                console.log("IE versie 10 of hoger");
                /*Opslaan met factuurnummer als bestandsnaam*/
                window.navigator.msSaveOrOpenBlob(blobObject, huidige_aanpassing(["0116"]) + ".txt");
            }
            if(!window.navigator.msSaveOrOpenBlob) {
                console.log("Andere browser dan IE")
                
                // If we are replacing a previously generated file we need to
                // manually revoke the object URL to avoid memory leaks.
            
                if (textFile !== null) {
                window.URL.revokeObjectURL(textFile);
                }

                textFile = window.URL.createObjectURL(blobObject);
                
                var link = document.getElementById('downloadlink');
                
                    link.href = textFile;
                    link.download = huidige_aanpassing(["0116"]) + ".txt" 
                    link.style.display = 'block';
            }
        }
    makeTextFile(tekst_bericht);
    
    }

    

function expand(d) {

    /*Click events worden doorgegeven aan de kind elementen
      Dat maakt dat je met een geneste lijst niet op de geneste lijstitems kan
      klikken zonder een functie te triggeren die aan de bovenliggende lijst is toegewezen. 
      Dus gaan we eerst controleren of het doel van de klik het element is dat daarvoor is bedoeld*/
    
    /*IE heeft een andere naam voor het doel :-( */
    var target = event.target || event.srcElement
    /*als het doel niet goed is, doe niks*/
    if (d3.select(target).attr("class") !== "records") {return;}; 
    
    var element = d3.select(this).select("ul");
    
    console.log("selected on click", element);
    
    if (element.classed("collapsed")) {
        element.classed("collapsed", false);
    } else {
        element.classed("collapsed", true);
    }

    console.log(element.attr("class"));
}



function change_inputs(targets, waarde) {
    "use strict";
    
    /*Selectie van inputvelden op basis van lijst (targets)*/
    var selectie = d3.selectAll(".items")
                     .filter(function (d) {return targets.indexOf(d.values[0].Volgnummer) !== -1})
                     .selectAll(".item_input");
/*    
    console.log("aanpassen in de volgende selectie: ", selectie);
    */
    
    /*Dan de waarden van de inputvelden in de geselecteerde items aanpassen*/
    selectie.attr("value", waarde); 
}

function huidige_waarde(targets) {
    "use strict";
    
    /*Selectie van inputvelden op basis van lijst (targets)*/
    var selectie = d3.selectAll(".items")
                     .filter(function (d) {return targets.indexOf(d.values[0].Volgnummer) !== -1})
                     .selectAll(".item_waarde");
    
    console.log(selectie);
    
    return selectie.html().trim(); 
}



function huidige_aanpassing(targets) {
    "use strict";
    
    /*Selectie van inputvelden op basis van lijst (targets)*/
    var selectie = d3.selectAll(".items")
                     .filter(function (d) {return targets.indexOf(d.values[0].Volgnummer) !== -1})
                     .selectAll(".item_input");
    
    console.log(selectie);
    
    return selectie.attr("value"); 
}






function aanpassen_dagtekening() {
    "use strict";

    var targets = ["0117"];
    change_inputs(targets, todaysDate());
}





function aanpassen_factuurnummer(type) {
    "use strict";
    
    var targets = ["0116"];
    
    if(type === "credit") {var factuurnummer = "99" + huidige_waarde(targets)};
    if(type === "debet") {var factuurnummer = "88" + huidige_waarde(targets)};
    
    change_inputs(targets, factuurnummer);
}






function aanpassen_startdatum(start) {
    "use strict";
    /*Voor elke declaratiestandaard apart*/
    
    if (bericht_versie.code_EI_bericht + "_" + bericht_versie.versie_EI_standaard === "181_01") {        
    /*dit zijn de velden die aangepast moeten worden*/
    var targets = ["0114", "0410"]
    change_inputs(targets, start);
    }
    
    if (bericht_versie.code_EI_bericht + "_" + bericht_versie.versie_EI_standaard === "181_02") {        
    /*dit zijn de velden die aangepast moeten worden*/
    var targets = ["0114", "0411", "0608", "0616"]
    change_inputs(targets, start);
    }
        
    if (bericht_versie.code_EI_bericht + "_" + bericht_versie.versie_EI_standaard === "195_01") {        
    /*dit zijn de velden die aangepast moeten worden*/
    var targets = ["0114", "0411", "0608", "0616"]
    change_inputs(targets, start);
    }
 
}


function aanpassen_einddatum(eind) {
    "use strict";
    /*Voor elke declaratiestandaard apart*/
    
    if (bericht_versie.code_EI_bericht + "_" + bericht_versie.versie_EI_standaard === "181_01") {        
    /*dit zijn de velden die aangepast moeten worden*/
    var targets = ["0115", "0411"]
    change_inputs(targets, eind);
    }
    
    if (bericht_versie.code_EI_bericht + "_" + bericht_versie.versie_EI_standaard === "181_02") {        
    /*dit zijn de velden die aangepast moeten worden*/
    var targets = ["0115", "0412", "0617"]
    change_inputs(targets, eind);
    }
        
    if (bericht_versie.code_EI_bericht + "_" + bericht_versie.versie_EI_standaard === "195_01") {        
    /*dit zijn de velden die aangepast moeten worden*/
    var targets = ["0115", "0412", "0617"]
    change_inputs(targets, eind);
    }
 
}


function aanpassen_prestatiecode(prestatie) {
    "use strict";
    /*Voor elke declaratiestandaard apart*/
    
    if (bericht_versie.code_EI_bericht + "_" + bericht_versie.versie_EI_standaard === "181_01") {        
    /*dit zijn de velden die aangepast moeten worden*/
    var targets = ["0412"];
    change_inputs(targets, prestatie);
    }
    
    if (bericht_versie.code_EI_bericht + "_" + bericht_versie.versie_EI_standaard === "181_02") {        
    /*dit zijn de velden die aangepast moeten worden*/
    var targets = ["0410"];
    change_inputs(targets, prestatie);
    }
        
    if (bericht_versie.code_EI_bericht + "_" + bericht_versie.versie_EI_standaard === "195_01") {        
    /*dit zijn de velden die aangepast moeten worden*/
    var targets = ["0410"];
    change_inputs(targets, prestatie);
    }
 
}



function aanpassen_declaratiecode(declaratiecode) {
    "use strict";
    /*Voor elke declaratiestandaard apart*/
    
    var targets;
    
    if (bericht_versie.code_EI_bericht + "_" + bericht_versie.versie_EI_standaard === "181_01") {        
    /*dit zijn de velden die aangepast moeten worden*/
    targets = ["0409"];
    change_inputs(targets, declaratiecode);
    }
    
    if (bericht_versie.code_EI_bericht + "_" + bericht_versie.versie_EI_standaard === "181_02") {        
    /*dit zijn de velden die aangepast moeten worden*/
    targets = ["0409", "0607", "0612"];
    change_inputs(targets, declaratiecode);
    }
        
    if (bericht_versie.code_EI_bericht + "_" + bericht_versie.versie_EI_standaard === "195_01") {        
    /*dit zijn de velden die aangepast moeten worden*/
    targets = ["0409", "0607", "0612", "1707"];
    change_inputs(targets, declaratiecode);
    }
 
}




function aanpassen_totale_tijd(totale_tijd) {
    "use strict";
    /*Voor elke declaratiestandaard apart*/
    
    var targets;
    
    if (bericht_versie.code_EI_bericht + "_" + bericht_versie.versie_EI_standaard === "181_02") {        
    /*dit zijn de velden die aangepast moeten worden*/
    targets = ["0619"];
    change_inputs(targets, totale_tijd);
    }
        
    if (bericht_versie.code_EI_bericht + "_" + bericht_versie.versie_EI_standaard === "195_01") {        
    /*dit zijn de velden die aangepast moeten worden*/
    targets = ["0435"];
    change_inputs(targets, totale_tijd);
    }
 
}




function aanpassen_directe_tijd(directe_tijd) {
    "use strict";
    /*Voor elke declaratiestandaard apart*/
    
    var targets;
        
    if (bericht_versie.code_EI_bericht + "_" + bericht_versie.versie_EI_standaard === "195_01") {        
    /*dit zijn de velden die aangepast moeten worden*/
    targets = ["0436"];
    change_inputs(targets, directe_tijd);
    }
 
}


function aanpassen_indirecte_tijd(indirecte_tijd) {
    "use strict";
    /*Voor elke declaratiestandaard apart*/
    
    var targets;
    
    if (bericht_versie.code_EI_bericht + "_" + bericht_versie.versie_EI_standaard === "181_02") {        
    /*dit zijn de velden die aangepast moeten worden*/
    targets = ["0620"];
    change_inputs(targets, indirecte_tijd);
    }
        
    if (bericht_versie.code_EI_bericht + "_" + bericht_versie.versie_EI_standaard === "195_01") {        
    /*dit zijn de velden die aangepast moeten worden*/
    targets = ["0437"];
    change_inputs(targets, indirecte_tijd);
    }
 
}


function aanpassen_verrekenpercentage(verrekenpercentage) {
    "use strict";
    /*Voor elke declaratiestandaard apart*/
    
    var targets;
    
    if (bericht_versie.code_EI_bericht + "_" + bericht_versie.versie_EI_standaard === "181_01") {        
    /*dit zijn de velden die aangepast moeten worden*/
    targets = ["0417"];
    change_inputs(targets, verrekenpercentage);
    }
        
    if (bericht_versie.code_EI_bericht + "_" + bericht_versie.versie_EI_standaard === "181_02") {        
    /*dit zijn de velden die aangepast moeten worden*/
    targets = ["0622"];
    change_inputs(targets, verrekenpercentage);
    }
 
}


function aanpassen_NZA_tarief(tarief) {
    "use strict";
    /*Voor elke declaratiestandaard apart*/
    
    var targets;
    
    if (bericht_versie.code_EI_bericht + "_" + bericht_versie.versie_EI_standaard === "181_01") {        
    /*dit zijn de velden die aangepast moeten worden*/
    targets = ["0418"];
    change_inputs(targets, tarief);
    }
        
    if (bericht_versie.code_EI_bericht + "_" + bericht_versie.versie_EI_standaard === "181_02") {        
    /*dit zijn de velden die aangepast moeten worden*/
    targets = ["0621"];
    change_inputs(targets, tarief);
    }
 
    if (bericht_versie.code_EI_bericht + "_" + bericht_versie.versie_EI_standaard === "195_01") {        
    /*dit zijn de velden die aangepast moeten worden*/
    targets = ["0619"];
    change_inputs(targets, tarief);
    }
    
    console.log("aanpassen_NZA_tarief", targets);
}



function aanpassen_declaratiebedrag(declaratiebedrag) {
    "use strict";
    /*Voor elke declaratiestandaard apart*/
    
    var targets;
    
    if (bericht_versie.code_EI_bericht + "_" + bericht_versie.versie_EI_standaard === "181_01") {        
    /*dit zijn de velden die aangepast moeten worden*/
    targets = ["0424", "9907"];
    change_inputs(targets, declaratiebedrag);
    }
        
    if (bericht_versie.code_EI_bericht + "_" + bericht_versie.versie_EI_standaard === "181_02") {        
    /*dit zijn de velden die aangepast moeten worden*/
    targets = ["0628", "9908"];
    change_inputs(targets, declaratiebedrag);
    }
 
    if (bericht_versie.code_EI_bericht + "_" + bericht_versie.versie_EI_standaard === "195_01") {        
    /*dit zijn de velden die aangepast moeten worden*/
    targets = ["0625", "9910"];
    change_inputs(targets, declaratiebedrag);
    }
    
    console.log("aanpassen declaratiebedrag", targets);
    
}




function aanpassen_berekend_bedrag(berekend_bedrag) {
    "use strict";
    /*Voor elke declaratiestandaard apart*/
    
    var targets;
    
    if (bericht_versie.code_EI_bericht + "_" + bericht_versie.versie_EI_standaard === "181_01") {        
    /*dit zijn de velden die aangepast moeten worden*/
    targets = ["0421"];
    change_inputs(targets, berekend_bedrag);
    }
        
    if (bericht_versie.code_EI_bericht + "_" + bericht_versie.versie_EI_standaard === "181_02") {        
    /*dit zijn de velden die aangepast moeten worden*/
    targets = ["0623"];
    change_inputs(targets, berekend_bedrag);
    }
 
    if (bericht_versie.code_EI_bericht + "_" + bericht_versie.versie_EI_standaard === "195_01") {        
    /*dit zijn de velden die aangepast moeten worden*/
    targets = ["0620"];
    change_inputs(targets, berekend_bedrag);
    }
}






function debet_credit() {
    "use strict"
    
    /*Voor elke declaratiestandaard apart*/
    if (bericht_versie.code_EI_bericht + "_" + bericht_versie.versie_EI_standaard === "181_01") {        
    /*dit zijn de velden die aangepast moeten worden*/
    var targets = ["0422", "0425", "9908"];
    change_inputs(targets, "C");
    }
    
    if (bericht_versie.code_EI_bericht + "_" + bericht_versie.versie_EI_standaard === "181_02") {        
    /*dit zijn de velden die aangepast moeten worden*/
    var targets = ["0417", "0624", "0626", "0629", "9909"];
    change_inputs(targets, "C");
    }
        
    if (bericht_versie.code_EI_bericht + "_" + bericht_versie.versie_EI_standaard === "195_01") {        
    /*dit zijn de velden die aangepast moeten worden*/
    var targets = ["0439", "0621", "0623", "0626", "1618", "1718", "9911"];
    change_inputs(targets, "C");
    }

}



function aanpassen_referentie_voorgaande() {
    "use strict"
    
    /*Het veld referentie voorgaande tijds (of prestatie-, of tarief- ) record wordt gebruikt bij creditering
    het moet gelijk zijn aan het referentienummer van het betreffende originele record. 
    Omdat er meerdere records kunnen zijn moet dit nummer dus achterhaald worden uit de originele data van 
    dit het betreffende record. Deze originel waarde is te vinden door eerst de parentnode van een record te pakken en 
    daarvan weer het juiste kind. Op die manier wordt voor*/
    
    var targets;
    
    /*Voor elke declaratiestandaard apart*/
    if (bericht_versie.code_EI_bericht + "_" + bericht_versie.versie_EI_standaard === "181_01") {        
    /*dit zijn de velden die aangepast moeten worden*/
    targets = ["0427"];
    }
    
    if (bericht_versie.code_EI_bericht + "_" + bericht_versie.versie_EI_standaard === "181_02") {        
    /*dit zijn de velden die aangepast moeten worden*/
    targets = ["0419", "0631"];
    }
    
    if (bericht_versie.code_EI_bericht + "_" + bericht_versie.versie_EI_standaard === "195_01") {        
    /*dit zijn de velden die aangepast moeten worden*/
    targets = ["0441", "0628", "1620", "1720"];    
    }   
        
    /*Selectie van inputvelden op basis van lijst (targets)*/
    var selectie = d3.selectAll(".items")
                     .filter(function (d) {return targets.indexOf(d.values[0].Volgnummer) !== -1})
                     .selectAll(".item_input");
    
    selectie.attr("value", function (d, i, j) { return this.parentNode.parentNode.previousElementSibling.__data__.waarde_origineel;})    
        

}


function aanpassen_referentie_dit(type) {
    "use strict"
    
    /*Bij crediteren moeten de referentienummers van een aantal records (prestatie, tarief, tijdsbesteding etc.) worden aangepast
    Afhankelijk van wat de actie (aanpassen debet, of crediteren) moet er 88 of 99 voor het factuurnummer komen*/
    
    var targets;
    
    /*Voor elke declaratiestandaard apart*/
    if (bericht_versie.code_EI_bericht + "_" + bericht_versie.versie_EI_standaard === "181_01") {        
    /*dit zijn de velden die aangepast moeten worden*/
    targets = ["0426"];
    }
    
    if (bericht_versie.code_EI_bericht + "_" + bericht_versie.versie_EI_standaard === "181_02") {        
    /*dit zijn de velden die aangepast moeten worden*/
    targets = ["0418", "0630"];
    }
    
    if (bericht_versie.code_EI_bericht + "_" + bericht_versie.versie_EI_standaard === "195_01") {        
    /*dit zijn de velden die aangepast moeten worden*/
    targets = ["0440", "0627", "1619", "1719"];    
    }   
        
    /*Selectie van inputvelden op basis van lijst (targets)*/
    var selectie = d3.selectAll(".items")
                     .filter(function (d) {return targets.indexOf(d.values[0].Volgnummer) !== -1})
                     .selectAll(".item_input");

    
    if (type === "debet"){
        selectie.attr("value", function (d)  {return "88" + this.parentNode.__data__.waarde_origineel;})
    }

    if (type === "credit"){
        selectie.attr("value", function (d)  {return "99" + this.parentNode.__data__.waarde_origineel;})
    }
    
}



function crediteren(){
    
    aanpassen_dagtekening();
    aanpassen_factuurnummer("credit");
    debet_credit();
    aanpassen_referentie_voorgaande();
    aanpassen_referentie_dit("credit");
    
    $("#export").show();
    $("#choose").hide();
    $("#credit").hide();
    $("#berichtkop").text("Exporteer bericht");

}


function bericht_aanpassen(){
    $(".divider").show();
    $("#apply").show();
    $("#export").show();
    $("#choose").hide();
    $("#credit").hide();
    $("#berichtkop").text("Pas het bericht aan");
    var subkop = $("#berichtsubkop")
    
    subkop.show();
    subkop.text("Gebruik een van de standaardacties of gebruik de velden in de recordlijst onder aan de pagina. Klik op toepassen voordat je het bericht exporteert (ook als je de standaaractie niet gebruikt) want daarmee wordt het factuurnummer en de dagtekening van de declaratie aangepast.");
    aanpassen_factuurnummer("debet");
}




function toepassen_aanpassingen() {
    "use strict";
    
    /*Eerst eventuele eerdere pogingen verwijderen*/
/*    var velden = document.querySelectorAll(".item_input");
    for (var i = 0; i < velden.length; i++) {velden[i].value = ""};*/
    
    
    console.log("bericht versie: ", bericht_versie);
    
var startdatum = document.getElementById("input_startdatum").value, 
    einddatum = document.getElementById("input_einddatum").value,
    prestatiecode = document.getElementById("input_prestatiecode").value,
    declaratiecode = document.getElementById("input_declaratiecode").value,
    totale_tijd = document.getElementById("input_totale_tijd").value,
    directe_tijd = document.getElementById("input_directe_tijd").value,
    indirecte_tijd = document.getElementById("input_indirecte_tijd").value,
    verrekenpercentage = document.getElementById("input_verrekenpercentage").value,
    NZA_tarief = document.getElementById("input_NZA_tarief").value,
    declaratiebedrag = document.getElementById("input_declaratiebedrag").value,
    berekend_bedrag = document.getElementById("input_berekend_bedrag").value;
    

    

    aanpassen_dagtekening();
/*    aanpassen_factuurnummer("debet");*/
    aanpassen_referentie_dit("debet");
    if(startdatum.length > 0) aanpassen_startdatum(startdatum); 
    if(einddatum.length > 0) aanpassen_einddatum(einddatum);  
    if(prestatiecode.length > 0) aanpassen_prestatiecode(prestatiecode); 
    if(declaratiecode.length > 0) aanpassen_declaratiecode(declaratiecode);         
    if(totale_tijd.length > 0) aanpassen_totale_tijd(totale_tijd);         
    if(directe_tijd.length > 0) aanpassen_directe_tijd(directe_tijd);         
    if(indirecte_tijd.length > 0) aanpassen_indirecte_tijd(indirecte_tijd);         
    if(verrekenpercentage.length > 0) aanpassen_verrekenpercentage(verrekenpercentage);         
    if(NZA_tarief.length > 0) aanpassen_NZA_tarief(NZA_tarief);  
    if(declaratiebedrag.length > 0) aanpassen_declaratiebedrag(declaratiebedrag);  
    if(berekend_bedrag.length > 0) aanpassen_berekend_bedrag(berekend_bedrag);                 
}    



d3.select("#submit").on("click", inlezen_bericht);
d3.select("#choose").on("click", bericht_aanpassen);
d3.select("#apply").on("click", toepassen_aanpassingen);    
d3.select("#export").on("click", correcties_uitlezen);
d3.select("#credit").on("click", crediteren);