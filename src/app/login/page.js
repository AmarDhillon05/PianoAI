"use client";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

function loginHandler(keypress, router) {
  document.getElementById("loginErrorText").innerHTML = "";

  if (keypress == "Enter") {
    const msgBody = JSON.stringify({
      user: document.getElementById("loginUsername").value,
      pswd: document.getElementById("loginPassword").value,
    });

    fetch("/api/login", { body: msgBody, method: "POST" })
      .then((data) => {
        data.text().then((text) => {
          if (text == "OK") {
            Cookies.set("user", document.getElementById("loginUsername").value);
            Cookies.set("modified", true)
            Cookies.set("otherModified", true)
            router.push("/dashboard");
          } else {
            document.getElementById("loginErrorText").innerHTML = text;
          }
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }
}

function createHandler(keypress, router) {
  document.getElementById("createErrorText").innerHTML = "";

  //Handling empty client-side to reject it fast
  let empty = false;
  if (
    document.getElementById("createUsername").value == "" ||
    document.getElementById("createPassword").value == ""
  ) {
    empty = true;
    document.getElementById("createErrorText").innerHTML =
      "Username and Password cannot be empty";
  }

  if (keypress == "Enter" && !empty) {
    const msgBody = JSON.stringify({
      user: document.getElementById("createUsername").value,
      pswd: document.getElementById("createPassword").value,
    });

    fetch("/api/create", { body: msgBody, method: "POST" })
      .then((data) => {
        data.text().then((text) => {
          if (text == "OK") {
            Cookies.set(
              "user",
              document.getElementById("createUsername").value
            );
            Cookies.set("modified", true)
            Cookies.set("otherModified", true)
            router.push("/dashboard");
          } else {
            document.getElementById("createErrorText").innerHTML = text;
          }
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }
}

export default function Login() {
  const router = useRouter();

  return (
    <div className="bg-slate-950">
      <div className="pt-10 text-5xl text-center text-slate-200">
        <span className="font-bold text-purple-400">Piano</span>AI
      </div>
      <div className="text-xl text-center text-slate-200">
          Start your melodic adventure here.
      </div>
      <div className="mt-10 flex w-full text-slate-100">
        <div id="login" className="w-1/2 p-16 bg-slate-900">
          <h1 className="text-center font-bold text-4xl mt-20 mb-10">
            Sign In
          </h1>
          <div>
            <label htmlFor="username" className="m-2 text-xl font-bold">
              Username
            </label>
            <input
              type="text"
              name="username"
              id="loginUsername"
              placeholder="e.g. abc9987"
              className="p-2 mx-1 w-full text-lg bg-transparent text-white border-b-2 border-slate-100 outline-none"
              onKeyDown={(e) => loginHandler(e.key, router)}
            ></input>
          </div>
          <div className="pt-10">
            <label htmlFor="password" className="m-3 text-xl font-bold">
              Password
            </label>
            <input
              type="password"
              name="password"
              id="loginPassword"
              placeholder="enter a secure password..."
              className="p-2 mx-1 w-full text-xl bg-transparent text-white border-b-2 border-slate-100 outline-none"
              onKeyDown={(e) => loginHandler(e.key, router)}
            ></input>
          </div>
          <br />
          <button
            onClick={(e) => loginHandler("Enter", router)}
            className="p-2 m-2 bg-blue-600 font-bold rounded"
          >
            Sign In
          </button>
          <p className="text-red-500" id="loginErrorText"></p>
        </div>
        <div id="create" className="w-1/2 p-16 bg-slate-800">
          <h1 className="text-center font-bold text-4xl mt-20 mb-10">
            Create Account
          </h1>
          <div>
            <label htmlFor="username" className="m-3 text-xl font-bold">
              Username
            </label>
            <input
              type="text"
              name="username"
              id="createUsername"
              placeholder = "e.g. abc129"
              className="p-2 mx-1 w-full text-lg bg-transparent text-white border-b-2 border-slate-100 outline-none"
              onKeyDown={(e) => loginHandler(e.key, router)}
            ></input>
          </div>
          <div className = 'mt-5'>
            <label htmlFor="password" className="m-3 text-xl font-bold">
              Password
            </label>
            <input
              type="password"
              name="password"
              id="createPassword"
              placeholder = "Enter a secure password..."
              className="p-2 mx-1 w-full text-lg bg-transparent text-white border-b-2 border-slate-100 outline-none"
              onKeyDown={(e) => createHandler(e.key, router)}
            ></input>
          </div>
          <br />
          <button
            className="p-2 m-2 bg-blue-500 text-white rounded font-bold m-auto"
            onClick={(e) => createHandler("Enter", router)}
          >
            Create Account
          </button>
          <p className="text-red-500" id="createErrorText"></p>
        </div>
      </div>
      <div className = "h-screen bg-black"></div>
    </div>
  );
}