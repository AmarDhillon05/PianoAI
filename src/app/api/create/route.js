import { DynamoDBClient, PutItemCommand, GetItemCommand, ScanCommand } from "@aws-sdk/client-dynamodb";

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
    let inUse = false

    //Using Scan command since Get is returning errors
    //This is for finding duplicates
    const scanCommand = new ScanCommand({TableName: "pianoaiusers"})

    try{
            const data = await client.send(scanCommand)
            for(let i = 0; i < data.Items.length; i ++) {
                let item = data.Items[i]
                if(item.id.S == body.user){
                    inUse = true
                    break
                }
            };
    }
    catch(err){
        console.log(err)
        return new Response("Internal Server Error")
    }
        

    if(!inUse){
        const putCommand = new PutItemCommand({TableName: "pianoaiusers",
            Item: {
                id: {S:body.user},
                password: {S:body.pswd},
                scores: {L: []}
            }
        })

        try{
            const data = await client.send(putCommand)
            return new Response("OK")
        }
        catch(err){
            console.log(err)
            return new Response("Internal Server Error")
        }
    }

    else{return new Response("Username already in use")}

    
}