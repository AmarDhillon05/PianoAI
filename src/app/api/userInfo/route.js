import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

const accessKey = process.env.ACCESS_KEY
const secretAccessKey = process.env.SECRET_ACCESS_KEY

const client = new DynamoDBClient({
    region: 'us-east-1',
    credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretAccessKey
    }
})
        //[ { user: { S: 'amar' }, pswd: { S: 'pianoaiiscool' } } ]

export async function GET(req) {
    return new Response("We are not accepting get requests!", {status: 400})
}

export async function POST(req) {
    const body = await req.json()
    
    //Using Scan command since Get is returning errors
    const command = new ScanCommand({TableName: "pianoaiusers"})

    try{
        let ok = false

        const data = await client.send(command)
        for(let i = 0; i < data.Items.length; i ++){
            let item = data.Items[i]
            if(item.id.S == body.user){
                ok = true
                return new Response(JSON.stringify(item.scores))
                break
            }
        };

        if(!ok){
            return new Response(JSON.stringify({status:400}))
        }
    }
    catch(err){
        console.log(err)
        return new Response(JSON.stringify({status:400}))
    }

}