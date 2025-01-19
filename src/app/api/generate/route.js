//Requests and sends back notes


export async function POST(req) {

    let body = await req.json()
    const notes = body.notes

    //Requesting from ec2
    const resp = await fetch(process.env.URL, {method: "POST", body: JSON.stringify(notes)})
    const json_resp = await resp.json()
    return new Response(JSON.stringify(json_resp))
    
}
