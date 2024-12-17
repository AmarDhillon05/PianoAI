import {Client} from "@gradio/client"

export async function POST(req) {

    //For now, we're using this api on huggingface to generate random piano music
    const client = await Client.connect("atsushieee/piano-music-generator")
    const result = await client.predict("/handle_play", {
        tempo: 120,
        duration_2n: false,
        duration_4n: true,
        duration_8n: true,
        duration_16n: true,
        duration_32n: false
    })
    const pattern = JSON.parse(result.data[0]).pattern
    let generated_notes = {}
    let i = 0
    pattern.forEach(el => {
        generated_notes[i] = {"note" : el.note, "duration" : el.duration}
        i ++
    });
      
    
    

    

    //Doing it :)
    return new Response(JSON.stringify(generated_notes))
    
}