import { createServer } from 'http';
import fs from 'fs';

function allowAllAnonymousAccess(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Expose-Headers', '*');
}

function accessControlConfig(req, res) {
    if (req.headers['sec-fetch-mode'] === 'cors') {
        allowAllAnonymousAccess(res);
        console.log("Client browser CORS check request");
    }
}

function CORS_Preflight(req, res) {
    if (req.method === 'OPTIONS') {
        res.end();
        console.log("Client browser CORS preflight check request");
        return true;
    }
    return false;
}

function extract_Name_From_Request(req) {
    let parts = req.url.split('/');
    return parts[parts.length - 1];
}

async function handleCountersServiceRequest(req, res) {
    if (req.url.startsWith("/api/counters")) {
        const countersFilePath = "./counters.json";
        let countersJSON = fs.existsSync(countersFilePath) ? fs.readFileSync(countersFilePath) : '{}';
        let counters = JSON.parse(countersJSON);
        let found = false;
        let counterName = extract_Name_From_Request(req);
        switch (req.method) {
            case 'GET':
                if (counterName === 'counters' || counterName === '') { // Fetch list of counters
                    res.writeHead(200, { 'content-type': 'application/json' });
                    res.end(JSON.stringify(counters));
                } else if (counterName !== undefined) { // Fetch a single counter value
                    for (let counter in counters) {
                        for (var propertyName in counters[counter]) {
                            if (propertyName == counterName) {
                                res.writeHead(200, { 'content-type': 'application/json' });
                                res.end(JSON.stringify(counters[counter]));
                                found = true;
                                break;
                            }
                        }
                    }
                    if (!found) {
                        res.writeHead(404);
                        res.end(`Error: The counter ${counterName} does not exist.`);
                    }

                }
                break;

            case 'POST':
                let newCounter = await getPayload(req);
                let key = Object.keys(newCounter)[0]; // nom de la key du counter
                if (newCounter && Object.keys(newCounter)[0] !== undefined) {
                    if (!isNaN(newCounter[key])) {// valeur du counter if is a number
                        counters.push(newCounter);
                        fs.writeFileSync(countersFilePath, JSON.stringify(counters));
                        res.writeHead(201, { 'content-type': 'application/json' });
                        res.end(JSON.stringify(newCounter));
                    } else {
                        res.writeHead(400);
                        res.end('Error: The value associated need to be a integer > 0');
                    }

                } else {

                }

                break;

            case 'PUT':
                if (counterName === 'counters' || counterName === '') {
                    res.writeHead(404);
                    res.end(`Error: Cannot change an unknown counter `);
                } else {
                    for (let counter in counters) {
                        let key = Object.keys(counters[counter])[0];
                        if (key === counterName) {
                            found = true;
                            counters[counter][counterName] += 1;
                            fs.writeFileSync(countersFilePath, JSON.stringify(counters));
                            res.writeHead(200);
                            res.end(JSON.stringify(counters));
                            break;
                        }
                    }
                    if (!found) {
                        res.writeHead(404);
                        res.end(`Error: Cannot change an unknown counter `);
                    }

                }
                break;

            case 'DELETE':

                if (counterName === 'counters' || counterName === '') {
                    res.writeHead(404);
                    res.end(`Error: Cannot change an unknown counter `);
                } else {
                    for (let counter in counters) {
                        let key = Object.keys(counters[counter])[0];
                        if (key === counterName) {
                            found = true;
                            counters[counter][counterName] -= 1;
                            let test = counters[counter];
                            if (counters[counter][counterName] <= 0) {
                                delete counters[counter];
                                counters.splice(counter,1);
                            }
                            fs.writeFileSync(countersFilePath, JSON.stringify(counters));
                            res.writeHead(200);
                            res.end(JSON.stringify(counters));
                            break;
                        }
                    }
                    if (!found) {
                        res.writeHead(404);
                        res.end(`Error: Cannot change an unknown counter `);
                    }

                }
                break;

            default:
                res.writeHead(501);
                res.end(`Error: Method ${req.method} is not implemented for counters.`);
                break;
        }
        return true;
    }
    return false;
}

async function handleRequest(req, res) {
    if (await handleCountersServiceRequest(req, res)) return true;
    return false;
}

function getPayload(req) {
    return new Promise(resolve => {
        let body = [];
        req.on('data', chunk => { body.push(chunk); }); // Accumule les morceaux du corps
        req.on('end', () => {
            body = Buffer.concat(body).toString(); // Assemble et convertit en chaîne
            if (body.length > 0 && req.headers['content-type'] === "application/json") {
                try {
                    const parsed = JSON.parse(body); // Tente de parser le JSON
                    resolve(parsed);
                } catch (error) {
                    console.log("Error parsing JSON:", error);
                    resolve(null); // En cas d'erreur, renvoie null
                }
            } else {
                resolve(null); // Si le corps est vide ou mal formaté
            }
        });
    });
}

const server = createServer(async (req, res) => {
    console.log(req.method, req.url);
    accessControlConfig(req, res);
    if (!CORS_Preflight(req, res)) {
        if (!await handleRequest(req, res)) {
            res.writeHead(404);
            res.end();
        }
    }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

