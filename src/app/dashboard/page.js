"use client"
import Cookies from "js-cookie"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Dashboard(){
    const user = Cookies.get("user")
    const router = useRouter()

    //Redurecting if user DNE
    if(user == 'undefined' || user == undefined){
        router.push("/login")
    }

    //Function for redirecting w new score
    function newScoreHandler(e){
        Cookies.set("new", true)
        Cookies.set("title", undefined)
        Cookies.set("author", user)
        router.push("/edit")
    }




    //
    useEffect(() => {
        const userScoresDiv = document.getElementById("userScoresList"), otherScoresDiv = document.getElementById("otherScoresList")
        const score_button_template = document.getElementById("score_button_template")
        score_button_template.style.visibility = "hidden"


        //Function to apply scores
        function applyUserScores(scores){
            //Removing previous ones
            
            Array.from(userScoresDiv.children).forEach(child => {userScoresDiv.removeChild(child)})

            //Putting the scores into the document
            let count = 0;
            scores.forEach(score => {
                count ++
                let strScore = score.S
                if(document.getElementById(strScore) == null){
                    let scoreEl = score_button_template.cloneNode(true)
                    scoreEl.style.visibility = "visible"
                    scoreEl.id = strScore
                    scoreEl.childNodes[0].childNodes[0].innerHTML = strScore
                    scoreEl.childNodes[0].childNodes[1].innerHTML = ""

                
                    scoreEl.addEventListener("click", () => {
                        Cookies.set("new", false)
                        Cookies.set("title", user + "." + strScore)
                        Cookies.set("author", user)
                        Cookies.set("notes", undefined)
                        router.push("/edit")
                    })//https://icons.getbootstrap.com/icons/music-note-list/

                    
                    userScoresDiv.appendChild(scoreEl)
                
                }
            });

            if(count == 0){
                userScoresDiv.innerHTML = "You currently have no scores"
            }
            else{document.getElementById("yourScoresInfoText").innerHTML = ""}

            Cookies.set("modified", true)
        }


        //Getting scores from cache and requesting for them if not cached
        var scores = Cookies.get("userScores")
        if(scores == "undefined" || scores == undefined || Cookies.get("modified") == "true"){
            scores = []

            document.getElementById("yourScoresInfoText").innerHTML = "Fetching your scores"
            fetch("/api/userInfo", {method: "POST", body: JSON.stringify({user : user})})
                .then(data => {
                data.json().then(fetchedScores => {
                    if(fetchedScores.status == 400){
                        document.getElementById("yourScoresErrText").innerHTML = "Unable to retrieve user's scores"
                    }
                    else{

                        Cookies.set("userScores", JSON.stringify(fetchedScores.L))      
                        scores = fetchedScores.L  
                        applyUserScores(scores)  
                    }
                })
            })
            .catch(err => {
                document.getElementById("yourScoresErrText").innerHTML = "Unable to retrieve user's scores"
            })
        }
        else{
            scores = JSON.parse(scores)
            applyUserScores(scores)
        }

        


        //Function to render other Scores
        function applyOtherScores(scores){
            //Removing 
            Array.from(otherScoresDiv.children).forEach(child => {otherScoresDiv.removeChild(child)})

            let count = 0
            Object.values(scores).forEach(score => {
                count += 1
                    score = JSON.parse(score)
                    let title = score.id.replace(score.author, "").slice(1), author = score.author
                    if(document.getElementById(score.author + "." + score.id) == null){
                        let scoreEl = score_button_template.cloneNode(true)
                        scoreEl.style.visibility = "visible"
                        scoreEl.id = score.author + "." + title
                        scoreEl.childNodes[0].childNodes[0].innerHTML = title
                        scoreEl.childNodes[0].childNodes[1].innerHTML = score.author
                            

                        scoreEl.addEventListener("click", () => {
                            Cookies.set("title", score.id)
                            Cookies.set("author", author)
                            Cookies.set("new", false)
                            Cookies.set("notes", undefined)
                            router.push("/edit")
                        })

                        otherScoresDiv.appendChild(scoreEl)
                    }
                });
                    
            if(count == 0){
                document.getElementById("otherScoresInfoText").innerHTML = "No other scores available"
            }
            else{document.getElementById("otherScoresInfoText").innerHTML = ""}

            Cookies.set("otherModified", false)
        }


        //Getting the other Scores
        scores = Cookies.get("otherScores")
        if(scores == "undefined" || scores == undefined || Cookies.get("otherModified") == "true"){
            document.getElementById("otherScoresInfoText").innerHTML = "Fetching other scores"
            fetch("/api/scoreInfo", {method: "POST", body: JSON.stringify({user : user, request : "otherScores"})})
                .then(data => {
                data.json().then(scores => {
                    if(scores.status == 400){
                        document.getElementById("otherScoresErrText").innerHTML = "Unable to retrieve scores"
                    }
                    else{
                        Cookies.set("otherScores", JSON.stringify(scores))
                        applyOtherScores(scores)
                    }
                })
            })
            .catch(err => {
                document.getElementById("otherScoresErrText").innerHTML = "Unable to retrieve scores"
            })
        } else{
            scores = JSON.parse(scores)
            applyOtherScores(scores)
        }
        
    })



    //
    return (
        <div className= "bg-black text-white h-screen">
            <div id = "banner" className = "w-full border-b-2 bg-purple-900 bg-opacity-50 border-purple-900 mb-4 px-10 py-10 flex">
                <h1 className = "text-4xl font-bold text-center content-center flex-row mr-96">Dashboard</h1>
                <button
                    className = "transition-allunderline border-b-2 border-blue-950 border-opacity-50 hover:border-opacity-100 hover:border-white flex-row ml-96" 
                    onClick={() => {
                        Cookies.set("user", undefined)
                        router.push("/login")
                    }}>Logout</button>
                </div>

            <div id = "userScores" className = "mx-20 py-10 border-t-2 border-purple-950 border-opacity-80 w-auto">
                <h1 className = "font-bold italic text-xl">Your Scores</h1>
                
                
                <div id = "userScoresList" className = "flex my-4 mx-4"></div>
                <p id = "yourScoresInfoText"></p>
                <p id = "yourScoresErrText" className = "text-red"></p>
                
                <button onClick={(e) => {newScoreHandler(e)}} className = "transition-all border-white border-2 hover:bg-purple-400 px-5 py-2">
                    Create New Score
                </button>
            </div>

            <div id = "otherScores" className = "mx-20 py-10 border-t-2 border-purple-950 border-opacity-80 w-auto">
                <h1 className = "font-bold italic text-xl">Browse Scores</h1>



                <div id = "otherScoresList" className = "flex my-4 mx-4"></div>
                <p id = "otherScoresInfoText"></p>
                <p id = "otherScoresErrText" className = "text-red"></p>
            </div>


            <button  id = "score_button_template" className = "transition-all duration-100 bg-slate-100 h-34 w-30 text-black flex flex-row px-2 py-2 border-purple-800 border-2 overflow-y-clip overflow-y-clip hover:bg-purple-100 shadow-purple-200 hover:shadow-md hover:shadow-purple-200 hover:border-black mx-4">
                <div className = "flex flex-col px-2">
                <h1 className = "text-md font-bold text-purple-600 w-20 overflow-x-clip" id = "title_text">Cry me a river!</h1>
                <p className = "italic text-sm w-20 overflow-x-clip" id = "author_text">Cuz I'm on a Yacht</p>
                </div>

                <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" fill="purple" className="bi bi-music-note-list" viewBox="0 0 16 16">
                <path d="M12 13c0 1.105-1.12 2-2.5 2S7 14.105 7 13s1.12-2 2.5-2 2.5.895 2.5 2"/>
                <path fillRule="evenodd" d="M12 3v10h-1V3z"/>
                <path d="M11 2.82a1 1 0 0 1 .804-.98l3-.6A1 1 0 0 1 16 2.22V4l-5 1z"/>
                <path fillRule="evenodd" d="M0 11.5a.5.5 0 0 1 .5-.5H4a.5.5 0 0 1 0 1H.5a.5.5 0 0 1-.5-.5m0-4A.5.5 0 0 1 .5 7H8a.5.5 0 0 1 0 1H.5a.5.5 0 0 1-.5-.5m0-4A.5.5 0 0 1 .5 3H8a.5.5 0 0 1 0 1H.5a.5.5 0 0 1-.5-.5"/>
                </svg>

            </button>



                        
        </div>
    )
}