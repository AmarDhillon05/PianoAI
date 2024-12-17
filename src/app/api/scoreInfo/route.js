import { DynamoDBClient, ScanCommand, UpdateItemCommand, PutItemCommand, DeleteItemCommand } from "@aws-sdk/client-dynamodb";

const accessKey = process.env.ACCESS_KEY
const secretAccessKey = process.env.SECRET_ACCESS_KEY


const client = new DynamoDBClient({
    region: 'us-east-1',
    credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretAccessKey
    }
})

export async function GET(req) {
    return new Response("We are not accepting get requests!", {status: 400})
}

export async function POST(req) {
    const body = await req.json()
    
    //For returning info abt a score
    if(body.request == "getScoreInfo"){
        //Using Scan command since Get is returning errors
        const command = new ScanCommand({TableName: "pianoaiscores"})

        try{
            let ok = false

            const data = await client.send(command)
            for(let i = 0; i < data.Items.length; i ++){
                let item = data.Items[i]
                if(item.id.S == body.score){
                    ok = true
                    return new Response(JSON.stringify(item))
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



    //For getting all the other scores
    else if(body.request == "otherScores"){
        const command = new ScanCommand({TableName : "pianoaiscores"})
        try{
            let scores = {}, idx = 0
            const data = await client.send(command)
            data.Items.forEach(item => {
                if(item.author.S != body.user){
                    scores[idx] = JSON.stringify({
                        'id' : item.id.S,
                        'author' : item.author.S
                    })
                    idx ++
                }
            })

        

            return new Response(JSON.stringify(scores))
        }
        catch(err){
            console.log(err)
            return new Response(JSON.stringify({status : 400}))
        }
    }


    //For saving 
    else if(body.request == "saveScoreInfo"){
        let ok = true

        //If the title changed, then throw an error for a bad title
        console.log(body)
        if(body.oldTitle != body.newTitle){
            
            //First, try to add a new title and break if there's an error
            let command = new PutItemCommand({
                TableName: "pianoaiscores", Item: {
                    "id" : {"S" : body.newTitle},
                    "author" : {"S" : body.author},
                    "notes" : {"S" : body.notes}
                }
            })
            try{
                const data = await client.send(command)
                

                //If we insert the new without error, delete the old
                if(body.new == false || body.new == "false"){
                    console.log("Deleting")
                    command = new DeleteItemCommand({
                        TableName: "pianoaiscores", Key : {
                            "id" : {"S" : body.oldTitle}
                        }
                    })
                    try{
                        const data = await client.send(command) //Just send the command and if there's an error in deleting, show it
                    }
                    catch(err){
                        console.log(err)
                        return new Response(JSON.stringify({status:400, reason: "Error changing score name"}))
                        ok = false
                    }
                }

            }
            catch(err){
                console.log(err)
                return new Response(JSON.stringify({status:400, reason : "Score with this name already exists"}))
                ok = false
            }
        }

        //Now, editing the list of users
        if(ok && (body.oldTitle != body.newTitle)){
            console.log("Editing the list of suers")
            let command = new ScanCommand({TableName: "pianoaiusers"})

            try{

                let findUserOk = false

                const data = await client.send(command)
                for(let i = 0; i < data.Items.length; i ++){
                    let item = data.Items[i]
                    if(item.id.S == body.author){
                        findUserOk = true
                        
                        //Editing the list of users
                        let found = false
                        let userScores = item.scores.L

                        for(let idx = 0; idx < userScores.length; idx ++){
                            if(body.author + "." + userScores[idx].S == body.oldTitle){
                                userScores.splice(idx, 1)
                                found = true
                                break
                            }
                        }
                        if(!found && (body.new == false || body.new == 'false')){
                            return new Response(JSON.stringify({status:400, reason : "Changing name of score failed"}))
                        }
                        userScores.push({"S" : body.newTitle.replace(body.author + ".", "")})
            
                        //Updating
                        command = new UpdateItemCommand(
                            {TableName:"pianoaiusers", Key: {"id" : {"S" : body.author}}, UpdateExpression: "SET scores = :scores",
                        ExpressionAttributeValues : {":scores" : {"L" : userScores}}}
                        )

                        try{
                            let finalResp = await client.send(command)
                            console.log(finalResp)
                        }
                        catch(err){
                            console.log(err)
                            ok = false
                            return new Response(JSON.stringify({status : 400, reason : "Changing name of score failed"}))
                        }

                        break
                    }
                };

                ok = findUserOk
                if(!findUserOk){
                    return new Response(JSON.stringify({status:400, reason : "Changing name of score failed"}))
                }
            }
            catch(err){
                console.log(err)
                return new Response(JSON.stringify({status:400, reason : "Changing name of score failed"}))
            }
        }


        //Now just
        if(ok){
            console.log("Updating")
            //Finally updating
            const command = new UpdateItemCommand(
                {
                    TableName : "pianoaiscores", Key : {"id" : {"S" : body.newTitle}}, 
                    UpdateExpression: "SET notes = :notes", ExpressionAttributeValues: {":notes" : {"S" : body.notes}}
                }    
            )

            try{
                const data = await client.send(command)
                console.log(body.notes)
                return new Response(JSON.stringify({status:200}))
            }
            catch(err){
                console.log(err)
                return new Response(JSON.stringify({status:400, reason : "Internal Server Error"}))
            }
        }
    }

}