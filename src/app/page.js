"use client";
import Image from "next/image";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className = "bg-black overflow-x-hidden overflow-y-auto">
      <div className ="bg-blank flex text-slate-200 font-medium py-5 border-bottom-2 border-blue-800">
        <div className = 'ml-16 text-3xl'><span className = 'font-bold text-purple-300'>Piano</span>AI</div>
       
      </div>
      <div className="flex flex-col items-center bg-slate-400" style={{
        "backgroundImage" : "url(bg.jpg)"
      }}>
      <p className="text-white font-bold w-3/4 m-auto text-center py-20 mt-10 text-5xl">
          An all-in-one place to compose and share piano music with AI
          assistance
        </p>
        <button
          className="p-3 m-2 text-slate-200 transition-all duration-125 bg-purple-600 hover:text-purple-600 hover:bg-slate-200 text-white rounded font-bold text-xl"
          onClick={(e) => {
            if (Cookies.get("user") == undefined) {
              router.push("/login");
            } else {
              router.push("/dashboard");
            }
          }}
        >
          Start Now
        </button>
        
        <div className = 'flex flex-colitems-center bg-black border-top-10 border-purple-700 w-full mt-10 h-screen px-10 pt-10 text-white'>

          <div className = 'pt-6 w-screen px-6 py-4 items-center'>
            <h1 className = "font-bold text-xl text-purple-300">What is <span className = "text-white">Piano<span className = "text-purple-500">AI?</span></span></h1>
            <p className = "text-md">PianoAI is a <span className = "text-purple-400">lightweight, beginner-friendly </span> music score editor and repository. You can create and play simple music, 
            look at other people's work for inspiration, or even use our <span className = "text-purple-400">generative AI</span> tool to spark your imagination</p>
            <img src = "icon1.png" className = "py-6 scale-90"></img>
          </div>

          <div className = 'pt-6 w-screen px-6 py-4 items-center'>
            <h1 className = "font-bold textxl text-purple-300">What was this <span className = "text-white">built </span> for?</h1>
            <p className = "text-md">PianoAI was a passion project meant to create a 
              <span className = "text-purple-400"> simple music editor</span> that beginners to playing and music theory 
              can play around with, without being overwhelmed by the complexities of other editors. It also was to provide a 
              <span className = "text-purple-400"> playground</span> to test generative 
              music models
            </p>
            <img src = "pianogif.gif" className = "py-4 scale-90"></img>
          </div>

          <div className = 'pt-6 w-screen px-6 py-4 items-center'>
            <h1 className = "font-bold text-xl text-purple-300">What is this <span className = "text-white">built </span> with?</h1>
            <p className = "text-md">This app was created with <span className = "text-purple-400">Next.js </span> for the site,
            with notes being rendered using Google's <span className = "text-purple-400">Vexflow</span> and played with 
            <span className = "text-purple-400"> Tone.js</span>, storge handled with 
            <span className = "text-purple-400"> DynamoDB</span>, and the generative model being 
            from <span className = "text-purple-400">HuggingFace.</span> Future plans involve fine-tuning a larger transformer model or 
            handcrafting a model for more efficient music generation</p>
            <img src = "icon2.png" className = "py-4 scale-110 scale-90"></img>
          </div>


        </div> 
      </div>
    </div>
  );
}