"use client"
export const dynamic = 'force-dynamic'

import Cookies from "js-cookie";
import { StaveNote, Renderer, Stave, Formatter, Beam, Accidental } from "vexflow";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";


export default function Edit(){
    const router = useRouter()

    //A couple of variables
    var notes = [[
        {"clef": "treble", "timesig": "4/4"},  new StaveNote({ keys: ["b/4"], duration: "qr" }),
        new StaveNote({ keys: ["b/4"], duration: "qr" }), new StaveNote({ keys: ["b/4"], duration: "qr" }),
         new StaveNote({ keys: ["b/4"], duration: "qr" }),
    ]]

    var edit = true
    var generating = false
    
    var mouseOverOutput = false

    var lastMouseMove = false

    var bar_x = 0, bar_y = 0, bar_width = 0, bar_height = 0

    var synth;

    




    //Function to turn notes into a storable JSON String
    function notesToJSON(){
        let arr = {}, i = 0
        notes.forEach(bar => {
            let barArr = []
            bar.forEach(note => {
                if(note instanceof StaveNote){
                    let duration = note.getDuration()
                    if(note.isRest()){
                        duration += "r"
                    }
                    barArr.push({'keys' : note.getKeys(), 'duration' : duration})
                }
                else{
                    barArr.push(note)
                }
            })
            arr[i] = barArr
            i ++
        })
        return JSON.stringify(arr)
    }


    //Function to save the current notes to db
    function saveNotesToDB(){
        
        //Encoding data of whether we change the title

        //Making request
        const title = document.getElementById("title").value
        fetch("/api/scoreInfo", {method: "POST", body : JSON.stringify({
            'request' : 'saveScoreInfo', 
            'notes' : notesToJSON(),
            'new' : Cookies.get("new"),
            'oldTitle' : Cookies.get("title"),
            'newTitle' : Cookies.get("user") + '.' + title,
            'author' : Cookies.get("author")
            })})
        .then(data => {
            const now = new Date()

            data.json().then(j => {
                if(j.status != 400){
                    document.getElementById("saveStatus").innerHTML = "Saved successfully at " + now.toLocaleTimeString()
                    document.getElementById("saveStatus").style.color = "white"
                    document.getElementById("saveStatus").style.fontWeight = "normal"
                    if(Cookies.get("new")){
                        Cookies.set("new", false)
                    }
                    Cookies.set("title", Cookies.get("user") + "." + title)
                    Cookies.set("modified", true) //For when you go back to dashboard
                }
                else{
                    document.getElementById("saveStatus").innerHTML = "Error when saving: " + j.reason
                    document.getElementById("saveStatus").style.color = "red"
                    document.getElementById("saveStatus").style.fontWeight = "bold"
                }
            })
        })
        .catch(err => {
            document.getElementById("saveStatus").innerHTML = "Error when saving: Internal Server Error"
            document.getElementById("saveStatus").style.color = "red"
            document.getElementById("saveStatus").style.fontWeight = "bold"
        })
    }


    //Constants to use for vexflow
    const notes_to_duration = {
        "quarter_note" : "q", "eigth_note" : "8", "sixteenth_note" : "16",
        "quarter_rest" : "qr", "eigth_rest" : "8r", "sixteenth_rest" : "16r"
    }

    const duration_to_number = {
        "q" : 1, "8" : 0.5, "16" : 0.25, "qr" : 1, "8r" : 0.5, "16r" : 0.25,
        "4" : 1
    }
    
    var last_hovered_bar = null

    var selected_note_idx = [-1, -1, -1]

    var last_keypress = Date.now()
    var last_save = 0

    //All the code for the click listeners
    function clickListener(e){
        if(edit){

        const staves = Array.from(document.getElementsByClassName("vf-stave"))
        const x = e.clientX, y = e.clientY
        let sum_of_notes_before = 0
        for(let i = 0; i < staves.length; i ++){
            let rect = staves[i].getBoundingClientRect()

            //Finding which stave was clicked
            if(x > rect.x && x < rect.x + rect.width && y > rect.y - 35 && y < rect.y + 35 + rect.height){
                
                //Note array for the spectrum of notes we're using
                let note_codes = [
                    "f/3", "g/3", 
                    "a/3", "b/3", "c/3", "d/3", "e/4", "f/4", "g/4",
                    "a/4", "b/4", "c/5", "d/5", "e/5", "f/5", "g/5",
                    "a/5", "b/5", "c/6", "d/6", "e/6"
                ]
                note_codes.reverse()

                //Getting the barline locations, and getting the note depending on which barline was found 
                let subdiv_size = 10
                let target_note = 0
                let subdivs = [
                    rect.y - 3 * subdiv_size,
                    rect.y - 2.5 * subdiv_size,
                    rect.y - 2 * subdiv_size,
                    rect.y - 1.5 * subdiv_size,
                    rect.y - 1 * subdiv_size,
                    rect.y - 0.5 * subdiv_size,
                    rect.y, 
                    rect.y + 0.5*subdiv_size,
                    rect.y + subdiv_size,
                    rect.y + 1.5*subdiv_size,
                    rect.y + 2*subdiv_size, 
                    rect.y + 2.5*subdiv_size,
                    rect.y + 3*subdiv_size, 
                    rect.y + 3.5*subdiv_size,
                    rect.y + 4*subdiv_size,
                    rect.y + 4.5 * subdiv_size,
                    rect.y + 5  * subdiv_size,
                    rect.y + 5.5 * subdiv_size,
                    rect.y + 6 * subdiv_size,
                    rect.y + 6.5 * subdiv_size,
                    rect.y + 7 * subdiv_size
                ]
                let note_dists = []
                for(let k = 0; k < subdivs.length; k ++){
                    note_dists.push(Math.abs(y - subdivs[k]))
                }

                let k = note_dists.indexOf(Math.min(...note_dists))
                target_note = note_codes[k]



               //Getting the note elements themselves to determine where to place the clicked note
               let bar_notes = Array.from(document.getElementsByClassName("vf-stavenote"))
               bar_notes = bar_notes.slice(sum_of_notes_before, sum_of_notes_before + notes[i].length)
               if(i != staves.length - 1){
                bar_notes = bar_notes.slice(0, -1)
               }
               
               for(let j = 0; j < bar_notes.length; j ++){
                let dist = x - (bar_notes[j].getBoundingClientRect().x + bar_notes[j].getBoundingClientRect().width / 2)

                //Handling intended when a note is clicked
                
               
                if(Math.abs(dist) <= 10){
                    dist = Math.abs(dist)

                    //Handling selecting notes for deletion
                    if(temp.src.includes("blank.png")){
                        //Blackout selected note
                        if(selected_note_idx[0] != -1 && selected_note_idx[1] != -1){
                            notes[selected_note_idx[0]][selected_note_idx[1]].setStyle({fillStyle: "black", strokeStyle: "black"})
                        }

                        selected_note_idx = [i, j + 1, -1]
                        let keys = notes[i][j + 1].getKeys()

                        //No Chord
                        if(keys.length == 1){
                            notes[i][j + 1].setStyle({fillStyle: "plum", strokeStyle: "plum"})
                      
                        }

                        else{
                            
                            //In case of chords, use target_note (if target_note was actually selected)
                            let idx = keys.indexOf(target_note)
                            if(idx != -1){
                                selected_note_idx[2] = idx
                                notes[i][j + 1].noteHeads[idx].setStyle({
                                    fillStyle: "plum", strokeStype: "plum"
                                })
                            }
                       
                        }

                        render_staff()

                    }

                    //Case where we wanna change the notes intsead of selecting em
                    else{
                        let duration = notes_to_duration[temp.src.replace(".png", "").split("/").at(-1).trim()]
                        let target = notes[i][j + 1]
                        
                        //Add to chord
                        if(duration == target.getDuration() && !target.isRest()){
                    
                            notes[i][j + 1] = new StaveNote(
                                {keys : [...new Set(target.getKeys().concat([target_note]))],
                                duration : target.getDuration()}
                            )
                        }
                        //Replace
                        else{
                           
                            if(duration.includes("r")){
                                notes[i][j + 1] = new StaveNote(
                                    {keys: ["b/4"], duration : duration}
                                )
                            }
                            else{
                                notes[i][j + 1] = new StaveNote(
                                    {keys : [target_note],
                                    duration : duration}
                                )
                            }
                        }

                        
                        render_staff()
                    }

                    break
                }


                //Handling adding notes in the middle
                else{
                    //Adding the note in the middle
                    if(dist > 0 
                        && (j == bar_notes.length - 1 
                            || (x - (bar_notes[j+1].getBoundingClientRect().x + bar_notes[j+1].getBoundingClientRect().width / 2) < 0
                            && Math.abs(x - (bar_notes[j+1].getBoundingClientRect().x + bar_notes[j+1].getBoundingClientRect().width / 2)) > 10)
                        )
                         && !temp.src.includes("blank.png")){

                        let duration = notes_to_duration[temp.src.replace(".png", "").split("/").at(-1)]
                        let insert_idx = j

                        if(Object.keys(notes[0][0]).includes("clef")){ insert_idx ++ }
                        if(Object.keys(notes[0][0]).includes("timesig")){ insert_idx ++ }

                        if(duration.includes("r")){notes[i].splice(insert_idx, 0, new StaveNote(
                            {keys: ["b/4"], duration: duration}
                        ))}else{notes[i].splice(insert_idx, 0, new StaveNote(
                            {keys: [target_note], duration: duration}
                        ))}

                        
                        render_staff()
                        break
                    }

                    //Adding before
                    else if(dist < 0 && j ==0 ){
                        let duration = notes_to_duration[temp.src.replace(".png", "").split("/").at(-1)]
                        let insert_idx = 0

                        if(Object.keys(notes[0][0]).includes("clef")){ insert_idx ++ }

                        if(duration.includes("r")){notes[i].splice(insert_idx, 0, new StaveNote(
                            {keys: ["b/4"], duration: duration}
                        ))}else{notes[i].splice(insert_idx, 0, new StaveNote(
                            {keys: [target_note], duration: duration}
                        ))}

                        
                        render_staff()
                        break
                    }
                }
                

               }
                


                break
            }
        
            sum_of_notes_before += notes[i].length - 1
        }

    }}


    //Function to create and render music staff based on the notes
    function render_staff_once(){

        //Pass through notes and make sure every bar fits their time signatures
        let beats_per_measure = 0
        for(let i = 0; i < notes.length; i ++){
            //Calculating beats per meature
            if(Object.keys(notes[i][0]).includes("timesig")){
                let ts = notes[i][0]['timesig']
                beats_per_measure = parseInt(ts.split("/")[0]) * duration_to_number[ts.split("/")[1]]
            }
            
            //Counting all the notes
            let bar_duration = 0
            let toAppend = []
            let spliceIdx = -1
            for(let j = 1; j < notes[i].length; j ++){
                bar_duration += duration_to_number[notes[i][j].duration]
                if(bar_duration > beats_per_measure){
                    toAppend.push(notes[i][j])
                    if(spliceIdx == -1){spliceIdx = j}
                }
            }

            //Splicing and appending
            if(spliceIdx > -1){
                notes[i] = notes[i].splice(0, spliceIdx)
                if(i == notes.length - 1){
                    toAppend = [{}].concat(toAppend)
                    notes.push(toAppend)
                }
                else{
                    notes[i + 1] = [notes[i + 1][0]].concat(toAppend).concat(notes[i + 1].slice(1,))
                }
            }

            //Adding if needed
            while(bar_duration < beats_per_measure){
                let diff = beats_per_measure - bar_duration
                if(diff >= 1){
                    notes[i].push(new StaveNote({keys: ["b/4"], duration: "qr"}))
                    bar_duration += 1
                }
                else if(diff >= 0.5){
                    notes[i].push(new StaveNote({keys: ["b/4"], duration: "8r"}))
                    bar_duration += 0.5
                }
                else{
                    notes[i].push(new StaveNote({keys: ["b/4"], duration: "16r"}))
                    bar_duration += 0.25
                }
            }
            

        }

        //Deleting and remaking output
        document.getElementById("output").remove()
        const output = document.createElement("div")
        output.id = "output"
        output.className = "h-screen"
        const output_container = document.getElementById("output_container")
        output_container.appendChild(output)
        
        // Boilerplate to generate the context to render from
        const div = document.getElementById("output");
        const renderer = new Renderer(div, Renderer.Backends.SVG);

        // Configure the rendering context.
        const width = 300 * notes.length + 20
        renderer.resize(300 * notes.length + 20, 100 * notes.length + 20);
        const context = renderer.getContext();
        
        // Making a stave for each bar, offsetting it each time
        let lastX = 0
        let lastWidth = 0
        let staveCount = 1
        let y = 0
        let n_staves = 4

        let barIdx = 0
        notes.forEach(bar => {
            let stave = new Stave(lastX + lastWidth, y, 270)
            if(staveCount > n_staves){
                y += 100
                stave = new Stave(0, y, 270)
                staveCount = 1
            }
            lastX = stave.x
            lastWidth = stave.width
            staveCount ++

            if(Object.keys(bar[0]).includes("clef")){
                stave.addClef(bar[0].clef)
            }
            if(Object.keys(bar[0]).includes("timesig")){
                stave.addTimeSignature(bar[0].timesig)
            }
            stave.setStyle({fillStyle : "black", strokeStyle : "black"})

            stave.setContext(context).draw()
            
            let beam_notes = []
            bar.forEach(note => {
                if(!(Object.keys(note).includes("timesig") && Object.keys(note).includes("clef")) && Object.keys(note).length > 0){
                    let i = 0

                    //Clear modifiers
                    note.modifiers = []

                    note.getKeys().forEach(k => {

                        if(k[1] == "b"){
                            note.addModifier(new Accidental("b"), i)
                        }
                        if(k.includes("#")){
                            note.addModifier(new Accidental("#"), i)
                        }

                        i ++
                    })

                    beam_notes.push(note)
                }
            })

            

            Formatter.FormatAndDraw(context, stave, bar.slice(1))
            const beams = Beam.generateBeams(beam_notes)
            beams.forEach(b => {
                b.setStyle({fillStyle : "black", strokeStyle : "black"})
                b.setContext(context).draw()
            })

            barIdx = barIdx + 1
        });


        //Adding click functions to add notes for all the bars
        //Using a general click function that searches through all bars because temp note intercepts click events
        document.body.removeEventListener("click", clickListener)
        document.body.addEventListener("click", clickListener)


        //Every key-press :)
        document.body.addEventListener("keydown", (e) => {

            //Always preventing page default
            if(e.ctrlKey && e.key == "s" && edit){
                e.preventDefault()
            }

            //Preventing detecting double key presses
            if(Date.now() - last_keypress > 200){
                //Delete Selected Note
                if(e.key == "Backspace" && selected_note_idx[0] != -1 && selected_note_idx[1] != -1){
                    if(selected_note_idx[2] == -1){
                        notes[selected_note_idx[0]].splice(selected_note_idx[1], 1)
                    }
                    else{
                        let keys = notes[selected_note_idx[0]][selected_note_idx[1]].getKeys()
                        let duration = notes[selected_note_idx[0]][selected_note_idx[1]].getDuration()
                        keys.splice(selected_note_idx[2], 1)
                        notes[selected_note_idx[0]][selected_note_idx[1]] = new StaveNote(
                            {keys : keys,
                            duration : duration}
                        )
                    }

                    selected_note_idx = [-1, -1, -1]
                    render_staff()
                }
            
                //Saving logic - Caches notes and saves after certain cooldowns to prevent spamming db   
                else if(e.ctrlKey && e.key == "s" && edit){
                    let notesStr = notesToJSON()

                    if(notesStr != Cookies.get('notes') || Cookies.get("new") == true || Cookies.get("title") != document.getElementById("title").value){
                        document.getElementById("saveStatus").innerHTML = "Saving ..."
                        Cookies.set('notes', notesStr)
                        if(Date.now() - last_save >= 500){
                            saveNotesToDB()
                        }

                        last_save = Date.now()
                    }
                    else{
                        const now = new Date()
                        document.getElementById("saveStatus").innerHTML = "Saved successfully at " + now.toLocaleTimeString()
                    }

                }

                       


                //Moving notes between flats
                else if(e.key == "ArrowUp" || e.key == "ArrowDown"){
                    
                    if(selected_note_idx[0] != -1 && selected_note_idx[1] != -1){
                        //Get the note we're tryna make
                        let note_codes = [
                            "f/3", "g/3", 
                            "a/3", "b/3", "c/4", "d/4", "e/4", "f/4", "g/4",
                            "a/4", "b/4", "c/5", "d/5", "e/5", "f/5", "g/5",
                            "a/5", "b/5", "c/6", "d/6", "e/6"
                        ]

                        let sub_idx = 0
                        if(selected_note_idx[2] != -1){
                            sub_idx = selected_note_idx[2]
                            notes[selected_note_idx[0]][selected_note_idx[1]].getKeys()[selected_note_idx[2]]
                        }
                        let current_note = notes[selected_note_idx[0]][selected_note_idx[1]].getKeys()[sub_idx]


                        if(!current_note.includes("r")){
                         
                            //Handling up or down
                            let current_raw = current_note.split("/")[0][0] + "/" + current_note.split("/")[1]
                            let idx = note_codes.indexOf(current_raw)
                    
                            if(e.key == "ArrowUp" && idx != note_codes.length){
                                if(current_note[1] == "b"){current_note = current_note.replace("b", "")}
                                else if(current_note.includes("#")){current_note = note_codes[idx + 1]}
                                else{current_note = current_note[0] + "#/" + current_note.split("/")[1]}
                            }

                            else if(e.key == "ArrowDown" && idx != 0){  
                                
                                if(current_note.includes("#")){current_note = current_note.replace("#", "")}
                                else if(current_note[1] == "b"){current_note = note_codes[idx - 1]}
                                else{current_note = current_note[0] + "b/" + current_note.split("/")[1];}
                                
                            }

                            

                            //Turning fb into e, e# into f, b# into c, and cb into b
                            let no_accidental_cases = {"fb" : "e", "e#" : "f", "b#" : "c", "cb" : "b"}
                            if(Object.keys(no_accidental_cases).includes(current_note.split("/")[0])){
                                let s = current_note.split("/")
                                current_note = no_accidental_cases[s[0]] + "/" + s[1]
                                if(s[0] == "b#"){
                                    current_note = no_accidental_cases[s[0]] + "/" + (parseInt(s[1]) + 1).toString()
                                }
                                else if(s[0] == "cb"){
                                    current_note = no_accidental_cases[s[0]] + "/" + (parseInt(s[1] - 1)).toString()
                                }
                            }
                        


                            //Replacing note
                            let duration = notes[selected_note_idx[0]][selected_note_idx[1]].getDuration()
                            let keys = notes[selected_note_idx[0]][selected_note_idx[1]].getKeys()
                            keys[sub_idx] = current_note

                            notes[selected_note_idx[0]][selected_note_idx[1]] = new StaveNote({
                                keys : keys, duration : duration
                            })

                            if(selected_note_idx[2] == -1){
                                notes[selected_note_idx[0]][selected_note_idx[1]].setStyle({fillStyle: "plum", strokeStyle: "plum"})
                            }
                            else{
                                notes[selected_note_idx[0]][selected_note_idx[1]].noteHeads[selected_note_idx[2]].setStyle({
                                    fillStyle: "plum", strokeStype: "plum"
                                })
                            }
                            

                            render_staff()
                        }

                    }
                }

            }

            let setLastKeyp = true
            if(e.ctrlKey){
                setLastKeyp = e.key == "s"
            }

            if(setLastKeyp){
                last_keypress = Date.now()
            }
         
        })


        //Rendering the grey "temporary" notes
        if(notes.length > 0){

            let temp = document.getElementById('temp'), svg = document.getElementById("output_container").getElementsByTagName("svg")[0]
            if(temp.src.includes("blank")){
                svg.style.cursor = "grab"
            }
            else{
                svg.style.cursor = "crosshair"
            }

            let staves = Array.from(document.getElementsByClassName("vf-stave"))
            staves.forEach(bar => {


                bar.addEventListener("mouseover", (e) => {
                    last_hovered_bar = bar

                    let r = bar.getBoundingClientRect()
                    bar_x = r.x
                    bar_y = r.y
                    bar_width = r.width
                    bar_height = r.height
                })
            })

            
        }
        
    }

    function render_staff(){
        render_staff_once()
        render_staff_once()

        //Now using this also for a cleaner saving implementation
        

    }  //Needed since note flags show up when drawing beams, I'll try finding a better solution



    //Function to update notes w the JSON data
    function updateNotesFromJSON(notesJSON){
        //Parsing notes to correct them 
        let notesarr = []
        Object.keys(notesJSON).forEach(barIdx => {
            let bar = notesJSON[barIdx], barArr = []
            bar.forEach(note => {
                if(Object.keys(note).includes("keys")){
                    //Sometimes these keys are in the wrong format (the one for tonejs), so we fix them first
                    let keys = note.keys
                    for(let i = 0; i < keys.length; i ++){
                        if(!keys[i].includes("/")){
                            keys[i] = keys[i].toLowerCase()
                            keys[i] = keys[i].slice(0, -1) + "/" + keys[i][keys[i].length - 1]
                        }
                    }

                    barArr.push(new StaveNote({
                        keys : keys, duration : note.duration
                    }))
                }
                else{
                    barArr.push(note)
                }
            })
            notesarr.push(barArr)
        })
        notes = notesarr
        render_staff()
    }

    useEffect(() => { 

        //First rerouting
        
        if(Cookies.get("user") == undefined || Cookies.get("user") == "undefined"){
            router.push("/login")
        }

        //Cookies.set("title", undefined)
        //Taking away save status if edit is true

        //Updating the data of our score if it isn't a new one
        
        //Setting the title to Untitled until we save it, and not editing the default notes
        if(Cookies.get("new") == true || Cookies.get("new") == 'true' || Cookies.get("title") == undefined){
            document.getElementById("title").value = "Untitled"
            Cookies.set("author", Cookies.get("user"))

            notes = [[
                {"clef": "treble", "timesig": "4/4"},  new StaveNote({ keys: ["b/4"], duration: "qr" }),
                new StaveNote({ keys: ["b/4"], duration: "qr" }), new StaveNote({ keys: ["b/4"], duration: "qr" }),
                 new StaveNote({ keys: ["b/4"], duration: "qr" }),
            ]]

            Cookies.set("notes", notesToJSON())
        }

        //Fetching the data if not cached, and loading otherwise
        else if(Cookies.get("notes") == undefined || Cookies.get("notes") == "undefined"){
            fetch("/api/scoreInfo", {method: "POST", body: JSON.stringify({"score" : Cookies.get("title"), "request" : "getScoreInfo"})})
            .then((data) => {
                data.json().then(scoreInfo => {
                    //Parsing notes to correct them 
                    let notesJson = JSON.parse(scoreInfo.notes.S)
                    updateNotesFromJSON(notesJson)

                    //Getting the title and if it's editable or not
                    let title = scoreInfo.id.S, author = scoreInfo.author.S
                    if(author != Cookies.get("user")){
                        edit = false
                        document.getElementById("editButtons").style.visibility = "hidden"
                    }
                    
                    document.getElementById("title").value =  title.replace(author + ".", "") //Dunno why I used the period, my mistake :(

                    //Updating based on cookies
                    Cookies.set("notes", JSON.stringify(notesJson))
                    Cookies.set("title", title)
                    Cookies.set("author", author)


                })
            })
            .catch(err => {edit = false})
        }
        else{
            //Case where data is cached, upload
            updateNotesFromJSON(JSON.parse(Cookies.get("notes")))

            let author = Cookies.get("author"), title = Cookies.get("title")
            if(author != Cookies.get("user")){
                edit = false
                document.getElementById("editButtons").style.visibility = "hidden"
            }

            document.getElementById("title").value =  title.replace(author + ".", "")
        }

        //Show status based on edit
        if(edit){
            document.getElementById("saveStatus").style.visibility = "visible"
        }
        else{
            document.getElementById("saveStatus").style.visibility = "hidden"
        }




        //Importing in useEffect since Tonejs can only run client-side
        
            async function add_tone_logic(){
                const tone = await import('tone')
            
                // To play notes
                synth = new tone.PolySynth({
                    oscillator: {
                        type: "sine", detune: 10, modulation: {
                            type: 'sawtooth'
                        }, spread: 10
                    }, 
                    voice: tone.Synth,
                    envelope: {
                        attack: 0.02,
                        decay: 0.2,
                        sustain: 0.5,
                        release: 0.3,
                    },
                    filter: {
                        type: "lowpass",
                        frequency: 1000,
                        rolloff: -12,
                    },
                    }).toDestination();
                
                    const reverb = new tone.Reverb({
                    decay: 2,  
                    preDelay: 0.01, 
                    }).toDestination();
                
                    synth.connect(reverb);


                    //Adding the button listener
                    document.getElementById("play").addEventListener("click", (e) => {
                        document.getElementById("playing").innerHTML = {"false" : "true", "true" : "false"}[document.getElementById("playing").innerHTML]
                        
                        if(document.getElementById("playing").innerHTML == "true"){
                            e.target.innerHTML = "Pause"

                            //Dict for converting duration to time interval
                            const quarter_note_interval = 0.75
                            const numerical_durations = {
                                "4" : quarter_note_interval, "8" : quarter_note_interval / 2,
                                "1" : quarter_note_interval / 4 //for 16 since taking first index
                            }

                        
                            synth.releaseAll()

                            async function play(){

                                let last_keys = null
                                
                                for(let i = 0; i < notes.length; i ++){
                                    

                                    const bar = notes[i]
                                    for(let j = 1; j < bar.length; j ++){
                                        if(last_keys){
                                            synth.triggerRelease(last_keys)
                                        }
                                        if(document.getElementById("playing").innerHTML == "false"){break}

                                        const note = bar[j]
                                        let keys = note.getKeys(), duration = note.getDuration()
                                        for(let k = 0; k < keys.length; k ++){keys[k] = keys[k].replace("/", "").toUpperCase()}
                                        duration = duration.replace("q", "4")

                                        if(!duration.includes("r") && !note.isRest()){
                                            synth.triggerAttack(keys)
                                            last_keys = keys
                                        }
                                        else{
                                            last_keys = null
                                        }
                                        
                                        await new Promise(r => setTimeout(r, numerical_durations[duration[0]] * 1000))
                                    }

                                    if(i == notes.length - 1){
                                        e.target.innerHTML = "Play"
                                    }
                                }

                                synth.releaseAll()
                            }

                            play()

                            document.getElementById("playing").innerHTML == "false"
                        

                        }
                        else{
                            e.target.innerHTML = "Play"
                            
                        }
                    })
            }

            
            if(typeof window !== undefined){add_tone_logic()}
            




        //Making all the notes black after loading them
        notes.forEach(bar => {
            bar.forEach(note => {
                if(note instanceof StaveNote){
                    note.setStyle({fillStyle : "black", strokeStyle : "black"})
                }
            })
        })

        //Setting the mouse over stuff so we can still click buttons
        const output_container = document.getElementById("output_container")
        output_container.addEventListener("mouseover", () => {mouseOverOutput = true})
        output_container.addEventListener("mouseout", () => {mouseOverOutput = false})


        //all the click stuff
        //EDIT: Cursor is currently too slow, so now just setting the cursor. Temp now stores what note we're selecting.
        document.addEventListener("mousemove", (e) => {
            if(edit && mouseOverOutput && Date.now() - lastMouseMove > 5){if(last_hovered_bar != null && !temp.src.includes("blank")){
    
                //Finding the positions of bars, and rendering note based on the closest area of the note
               const temp = document.getElementById("temp"), x = e.clientX, y = e.clientY

               if(bar_y < y && bar_y + bar_height > y && bar_x < x && bar_x + bar_width > x){
                temp.style.visibility = "visible"
                let translate_y = y - 40
                if(temp.src.includes("rest")){
                    translate_y = y - 30
                }
                temp.style.transform = `translate(${x}px, ${translate_y}px)`
               }

               lastMouseMove = Date.now()
    
            }
        }})
        
        render_staff() })


    //Handling changing note selecting
    function noteChange(e){
        const el = e.target
        const temp = document.getElementById("temp")
        const svg = document.getElementById("output_container").getElementsByTagName("svg")[0]

        if(el.id.includes("on")){
            el.id = el.id.replace("_on", "")
            temp.src = ""

            el.className = "p-3 m-2 text-slate-200 transition-all border-2 text-white border-white bg-black hover:bg-purple-500 text-white rounded text-xl w-10 h-10" 
        }
        else{
            temp.src = "/" + el.id + ".png"
            el.id = el.id + "_on"
            Array.from(document.getElementById("note_buttons").children).forEach(btn => {
                btn.id = btn.id.replace("_on", "")
                btn.className = "p-3 m-2 text-slate-200 transition-all border-2 text-white border-white bg-black hover:bg-purple-500 text-white rounded text-xl w-10 h-10" 
            })
            if(temp.src.includes("rest")){
                temp.style.width = "20px"
                temp.style.height = "40px"
            }
            else{
                temp.style.width = "25px"
                temp.style.height = "50px"
            }

            //Changing cursor
            if(temp.src.includes("blank")){
                svg.style.cursor = "grab"
            }
            else{
                svg.style.cursor = "crosshair"
            }

            el.className = "p-3 m-2 text-slate-200 transition-all border-2 text-white border-white hover:bg-black bg-purple-500 text-white rounded text-xl w-10 h-10" 

            
        }

        //In any case, reset the selected notes
        if(selected_note_idx[0] != -1){
            if(selected_note_idx[2] == -1){
                notes[selected_note_idx[0]][selected_note_idx[1]].setStyle({fillStyle:"black", strokeStyle:"black"})
            }
            else{
                notes[selected_note_idx[0]][selected_note_idx[1]].noteHeads[selected_note_idx[2]].setStyle({fillStyle:"black", strokeStyle:"black"})
            }
            render_staff()
        }
        selected_note_idx = [-1, -1, -1]

        temp.style.visibility = "hidden"
    }


    //Function for toggling guide
    function toggle_guide(e){
        const guide = document.getElementById("guide")
        if(guide.style.width == "0px"){
            guide.style.visibility = "visible"
            guide.style.width = "400px"
            guide.style.paddingLeft = "10px"
            guide.style.paddingRight = "10px"
        }
        else{
            guide.style.visibility = "hidden"
            guide.style.width = "0px"
            guide.style.paddingLeft = "0px"
            guide.style.paddingRight = "0px"
        }
    }



    return (
        <div id = "document" className = "bg-black h-screen w-screen overflow-hidden border-box m-0 overflow-clip">

            <div id = "header" className = "bg-purple-700 text-white border-b-8 border-purple-900 px-10 pb-5 pt-5 flex">
                <div className = "flex flex-col">
                    <input id = "title" className = "text-3xl font-bold bg-purple-700 flex-col"></input>
                    <p id = "saveStatus" className = "italic text-white flex-col">Save your work with Ctrl + S</p>
                </div>

                <div className = "flex-row pl-96 ml-96">
                    <button
                    className = "transition-all underline border-b-2 border-purple-700 hover:border-white" 
                    onClick={() => {
                        router.push("/dashboard")
                    }}>Back to dashboard</button>

                    <br></br>

                    <button
                    className = "transition-all underline border-b-2 border-purple-700 hover:border-white" 
                    onClick={() => {
                        Cookies.set("user", undefined)
                        router.push("/login")
                    }}>Logout</button>
                </div>
            </div>



            <div className = "flex flex-row px-5">

                
            

                <div id = "editButtons" className = "flex flex-col px-3 py-5 border-r-8 border-purple-600  min-w-48 max-w-48">


                    <button 
                    className = 'transition-all text-white border-2 border-white bg-black hover:bg-purple-500 flex-row my-1 py-2' onClick={() => {
                        let clef_timesig = {}
                        if(notes.length == 0){
                            clef_timesig = {"clef" : "treble", "timesig" : "4/4"}
                        }
                        notes.push([
                            clef_timesig,
                            new StaveNote({ keys: ["b/4"], duration: "qr" }),
                            new StaveNote({ keys: ["b/4"], duration: "qr" }),
                            new StaveNote({ keys: ["b/4"], duration: "qr" }),
                            new StaveNote({ keys: ["b/4"], duration: "qr" }),
                        ])
                        render_staff()
                    }}>Add Empty Bar</button>

                    <button className = 'transition-all text-white border-2 border-white bg-black hover:bg-purple-500 flex-row my-1 py-2' onClick={() => {
                        notes.pop()
                        render_staff()
                        document.getElementById("temp").style.visibility = "hidden"
                    }}>Delete Last Bar</button>


                    <div id = "note_buttons" className="items-center grid grid-cols-2">

                        <button id = "blank" className = "p-3 m-2 text-slate-200 transition-all border-2 text-white border-white bg-black hover:bg-purple-500 text-white rounded text-xl w-10 h-10" 
                        onClick={noteChange}> </button>

                        <button id = "quarter_note" className = "p-3 m-2 text-slate-200 transition-all border-2 text-white border-white bg-black hover:bg-purple-500 text-white rounded text-xl w-10 h-10"  
                        onClick={noteChange}>♩</button>

                        <button id = "eigth_note" className = "p-3 m-2 text-slate-200 transition-all border-2 text-white border-white bg-black hover:bg-purple-500 text-white rounded text-xl w-10 h-10"  
                        onClick={noteChange}>♪</button>

                        <button id = "sixteenth_note" className = "p-3 m-2 text-slate-200 transition-all border-2 text-white border-white bg-black hover:bg-purple-500 text-white rounded text-xl w-10 h-10" 
                        onClick={noteChange}>𝅘𝅥𝅯</button>

                        <button id = "quarter_rest" className = "p-3 m-2 text-slate-200 transition-all border-2 text-white border-white bg-black hover:bg-purple-500 text-white rounded text-xl w-10 h-10"  
                        onClick={noteChange}>𝄽</button>

                        <button id = "eigth_rest" className = "p-3 m-2 text-slate-200 transition-all border-2 text-white border-white bg-black hover:bg-purple-500 text-white rounded text-xl w-10 h-10"  
                        onClick={noteChange}>𝄾</button>

                        <button id = "sixteenth_rest" className = "p-3 m-2 text-slate-200 transition-all border-2 text-white border-white bg-black hover:bg-purple-500 text-white rounded text-xl w-10 h-10" 
                        onClick={noteChange}>𝄿</button>

                    </div>   

                    <button id = "generate"
                    className = 'transition-all text-white border-2 border-white bg-black hover:bg-purple-500 flex-row my-1 py-2' onClick={(e) => {
                        
                        if(!generating){
                            e.target.innerHTML = "Generating..."
                            
                            //Generating notes array
                            let notes_array = []
                            for(let i = 0; i < notes.length; i ++){
                                let bar = []
                                notes[i].forEach(item => {
                                    if(item instanceof StaveNote){
                                        bar.push(JSON.stringify({'keys' : item.getKeys(), 'duration' : item.getDuration()}))
                                    }else{
                                        bar.push(JSON.stringify(item))
                                    }
                                })
                                notes_array.push("[" + bar.toString() + "]")
                            }
                            notes_array = notes_array.toString()

                            //Loading notes
                            //Current API is very simple and only generates sequential notes
                            fetch("/api/generate", {method : "POST"}).then(data => data.json().then(resp => {
                                Object.values(resp).forEach(note => {
                                    let key = note.note.toLowerCase()
                                    key = key.substring(0, key.length - 1) + "/" + key[key.length - 1]
                                    let duration = note.duration
                                    if(duration.includes("n")){
                                        duration = duration.substring(0, duration.length - 1)
                                    }
                                    notes[notes.length - 1].push(new StaveNote({
                                        keys : [key], duration : duration
                                    }))
                                })

                                generating = false
                                e.target.innerHTML = "Generate"
                                render_staff()
                            }))

                        }
                    }}>Generate</button>


                    <button className = "transition-all underline border-b-2 border-black hover:border-white text-white py-2"
                    onClick={toggle_guide}>
                        Guide
                    </button>

                   


                </div>

                <div id = "playing" className = "hidden">false</div>

                <div id = "output_container" className = "flex flex-col bg-gray-200 w-screen h-screen px-5 py-5 overflow-auto items-left">
                    <button id = "play" className = "scale-100 transition-all text-purple-500 hover:text-purple-300 font-bold text-left" >Play</button>

                    <div id = "output" className = "h-screen"></div>

                    
                </div>

                <div id = "guide" className = "flex flex-col transition-all bg-purple-700 h-screen text-white"
                style = {{"visibility" : "hidden", "width" : "0px", "paddingLeft" : "0px", "paddingRight" : "0px", "borderLeft" : "4px solid black"}}>

                    <button onClick = {toggle_guide} className = "transition-all duration-100 text-white hover:text-red-400 text-lg text-left">
                    &times;</button>

                    <h1 className = "font-bold text-center text-xl">Guide to <span className = "text-purple-300">Piano</span>AI</h1>

                    <p className = "pt-2 text-xs font-semibold">Welcome! Start by clicking 
                        <span className = "text-purple-300 text-bold">"Add Empty Bar"</span> to 
                    add your first measure. An 
                    empty measure of notes will be created.  <br></br> <br></br>
                    
                    Click any of the note buttons <span className = "text-purple-300 text-bold">(♩, ♪, 𝅘𝅥𝅯, 𝄽, 𝄾, 𝄿) </span>
                    to select the note type you want to use. 
                    Click on top of an existing note of a different type to replace it at the note value 
                    you want, and click one of the same type to create chords. Click between two notes to insert a note between them.
                    <br></br><br></br>
                    
                    Select the blank button to enable note selection. Then, click the head of a note you want to select. While selected, a 
                    note can be deleted with <span className = "text-purple-300 text-bold">backspace</span> or moved up and down half a note with 
                    <span className = "text-purple-300 text-bold">up and down arrow keys.</span> If you make any major mistakes, you can always click 
                    <span className="text-purple-300 text-bold"> Delete Last bar</span> to remove the last selected measure.
                    <br></br><br></br>

                    If you're in a creative stump, try using the <span className = "text-purple-300 text-bold">Generate</span> button to get a few 
                    AI-generated measures you can play around with.
                    <br></br><br></br>
                    
                    Finally, you'll want to make the finishing touch - Changing the title of your masterpiece, simply by cliking on the title 
                    above. Then, make sure to save your work so everybody can see and hear your art.
                    <br></br><br></br>
                    
                    More features, such as an extended editor, faster UI, and improved AI, are coming soon, so stay tuned!
                    <br></br><br></br>
                    
                    Happy composing!</p>
                </div>

                
            </div>


            <img id = "temp" src = "blank.png" style = {{position: "absolute", visibility: "hidden", width:"20px", height: "40px", left: "0px", right: "0px"}}></img>
        </div>
    )
}