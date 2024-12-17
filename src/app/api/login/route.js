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
    const body = await req.json();
    let ok = false;

    // Using Scan command since Get is returning errors
    const command = new ScanCommand({ TableName: "pianoaiusers" });

    try {
        const data = await client.send(command);

        data.Items.forEach(item => {
            if (item.id.S == body.user) {
                if (item.password.S == body.pswd) { 
                    ok = true;
                    console.log(ok);
                    return;  // Exit the loop as we found the correct user
                }
            }
        });

        if (ok) {
            return new Response("OK");
        } else {
            return new Response("Incorrect username or password");
        }
    } catch (error) {
        return new Response("Internal Error");
    }
}
