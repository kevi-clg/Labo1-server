import { createServer } from 'http';
import fs from 'fs';

function allowAllAnonymousAccess(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Expose-Headers', '*');
}
function accessControlConfig(req, res) {
    if (req.headers['sec-fetch-mode'] == 'cors') {
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
function extract_Id_From_Request(req) {
    // .../api/ressources/id
    let parts = req.url.split('/');
    return parseInt(parts[parts.length - 1]);
}
function validatecontact(contact) {
    if (!('Name' in contact)) return 'Name is missing';
    if (!('Phone' in contact)) return 'Phone is missing';
    if (!('Email' in contact)) return 'Email is missing';
    return '';
}
async function handlecontactsServiceRequest(req, res) {
    if (req.url.includes("/api/contacts")) {
        const contactsFilePath = "./contacts.json";
        let contactsJSON = fs.readFileSync(contactsFilePath);
        let contacts = JSON.parse(contactsJSON);
        let validStatus = '';
        let id = extract_Id_From_Request(req);
        switch (req.method) {
            case 'GET':
                if (isNaN(id)) {
                    res.writeHead(200, { 'content-type': 'application/json' });
                    res.end(contactsJSON);
                } else {
                    let found = false;
                    for (let contact of contacts) {
                        if (contact.Id === id) {
                            found = true;
                            res.writeHead(200, { 'content-type': 'application/json' });
                            res.end(JSON.stringify(contact));
                            break;
                        }
                    }
                    if (!found) {
                        res.writeHead(404);
                        res.end(`Error : The contact of id ${id} does not exist`);
                    }
                }
                break;
            case 'POST':
                let newcontact = await getPayload(req);
                validStatus = validatecontact(newcontact);
                if (validStatus == '') {
                    let maxId = 0;
                    contacts.forEach(contact => {
                        if (contact.Id > maxId)
                            maxId = contact.Id;
                    });
                    newcontact.Id = maxId + 1;
                    contacts.push(newcontact);
                    fs.writeFileSync(contactsFilePath, JSON.stringify(contacts));
                    res.writeHead(201, { 'content-type': 'application/json' });
                    res.end(JSON.stringify(newcontact));
                } else {
                    res.writeHead(400);
                    res.end(`Error: ${validStatus}`);
                }
                break;
            case 'PUT':
                let modifiedcontact = await getPayload(req);
                validStatus = validatecontact(modifiedcontact);
                if (validStatus == '') {
                    if (!isNaN(id)) {
                        if (!('Id' in modifiedcontact)) modifiedcontact.Id = id;
                        if (modifiedcontact.Id == id) {
                            let storedcontact = null;
                            for (let contact of contacts) {
                                if (contact.Id === id) {
                                    storedcontact = contact;
                                    break;
                                }
                            }
                            if (storedcontact != null) {
                                storedcontact.Name = modifiedcontact.Name;
                                storedcontact.Phone = modifiedcontact.Phone;
                                storedcontact.Email = modifiedcontact.Email;
                                fs.writeFileSync(contactsFilePath, JSON.stringify(contacts));
                                res.writeHead(200);
                                res.end();
                            } else {
                                res.writeHead(404);
                                res.end(`Error: The contact of id ${id} does not exist.`);
                            }
                        } else {
                            res.writeHead(409);
                            res.end(`Error: Conflict of id`);
                        }
                    } else {
                        res.writeHead(400);
                        res.end("Error : You must provide the id of contact to modify.");
                    }
                } else {
                    res.writeHead(400);
                    res.end(`Error: ${validStatus}`);
                }
                break;
            case 'DELETE':
                if (!isNaN(id)) {
                    let index = 0;
                    let oneDeleted = false;
                    for (let contact of contacts) {
                        if (contact.Id === id) {
                            contacts.splice(index, 1);
                            fs.writeFileSync(contactsFilePath, JSON.stringify(contacts));
                            oneDeleted = true;
                            break;
                        }
                        index++;
                    }
                    if (oneDeleted) {
                        res.writeHead(204); // success no content
                        res.end();
                    } else {
                        res.writeHead(404);
                        res.end(`Error: The contact of id ${id} does not exist.`);
                    }
                } else {
                    res.writeHead(400);
                    res.end("Error : You must provide the id of contact to delete.");
                }
                break;
            case 'PATCH':
                res.writeHead(501);
                res.end("Error: The endpoint PATCH api/contacts is not implemented.");
                break;
        }
        return true;
    }
    return false;
}

function validateBookmark(bookmark) {
    if (!('URL' in bookmark)) return 'URL is missing';
    if (!('Name' in bookmark)) return 'Name is missing';
    if (!('Title' in bookmark)) return 'Title is missing';
    return '';
}
async function handleBookmarksServiceRequest(req, res) {
    if (req.url.includes("/api/bookmarks")) {
        const bookmarksFilePath = "./bookmarks.json";
        let bookmarksJSON = fs.readFileSync(bookmarksFilePath);
        let bookmarks = JSON.parse(bookmarksJSON);
        let validStatus = '';
        let id = extract_Id_From_Request(req);
        switch (req.method) {
            case 'GET':
                if (isNaN(id)) {
                    res.writeHead(200, { 'content-type': 'application/json' });
                    res.end(bookmarksJSON);
                } else {
                    let found = false;
                    for (let bookmark of bookmarks) {
                        if (bookmark.Id === id) {
                            found = true;
                            res.writeHead(200, { 'content-type': 'application/json' });
                            res.end(JSON.stringify(bookmark));
                            break;
                        }
                    }
                    if (!found) {
                        res.writeHead(404);
                        res.end(`Error : The bookmark of id ${id} does not exist`);
                    }
                }
                break;
            case 'POST':
                let newbookmark = await getPayload(req);
                validStatus = validateBookmark(newbookmark);
                if (validStatus == '') {
                    let maxId = 0;
                    bookmarks.forEach(bookmark => {
                        if (bookmark.Id > maxId)
                            maxId = bookmark.Id;
                    });
                    newbookmark.Id = maxId + 1;
                    bookmarks.push(newbookmark);
                    fs.writeFileSync(bookmarksFilePath, JSON.stringify(bookmarks));
                    res.writeHead(201, { 'content-type': 'application/json' });
                    res.end(JSON.stringify(newbookmark));
                } else {
                    res.writeHead(400);
                    res.end(`Error: ${validStatus}`);
                }
                break;
            case 'PUT':
                let modifiedbookmark = await getPayload(req);
                validStatus = validateBookmark(modifiedbookmark);
                if (validStatus == '') {
                    if (!isNaN(id)) {
                        if (!('Id' in modifiedbookmark)) modifiedbookmark.Id = id;
                        if (modifiedbookmark.Id == id) {
                            let storedbookmark = null;
                            for (let bookmark of bookmarks) {
                                if (bookmark.Id === id) {
                                    storedbookmark = bookmark;
                                    break;
                                }
                            }
                            if (storedbookmark != null) {
                                storedbookmark.Url = modifiedbookmark.Url;
                                storedbookmark.Name = modifiedbookmark.Name;
                                storedbookmark.Title = modifiedbookmark.Title;
                                fs.writeFileSync(bookmarksFilePath, JSON.stringify(bookmarks));
                                res.writeHead(200);
                                res.end();
                            } else {
                                res.writeHead(404);
                                res.end(`Error: The bookmark of id ${id} does not exist.`);
                            }
                        } else {
                            res.writeHead(409);
                            res.end(`Error: Conflict of id`);
                        }
                    } else {
                        res.writeHead(400);
                        res.end("Error : You must provide the id of bookmark to modify.");
                    }
                } else {
                    res.writeHead(400);
                    res.end(`Error: ${validStatus}`);
                }
                break;
            case 'DELETE':
                if (!isNaN(id)) {
                    let index = 0;
                    let oneDeleted = false;
                    for (let bookmark of bookmarks) {
                        if (bookmark.Id === id) {
                            bookmarks.splice(index, 1);
                            fs.writeFileSync(bookmarksFilePath, JSON.stringify(bookmarks));
                            oneDeleted = true;
                            break;
                        }
                        index++;
                    }
                    if (oneDeleted) {
                        res.writeHead(204); // success no content
                        res.end();
                    } else {
                        res.writeHead(404);
                        res.end(`Error: The contact of id ${id} does not exist.`);
                    }
                } else {
                    res.writeHead(400);
                    res.end("Error : You must provide the id of contact to delete.");
                }
                break;
            case 'PATCH':
                res.writeHead(501);
                res.end("Error: The endpoint PATCH api/contacts is not implemented.");
                break;
        }
        return true;
    }
    return false;
}

async function handleRequest(req, res) {
    if( await handlecontactsServiceRequest(req, res)) return true;
    if( await handleBookmarksServiceRequest(req, res)) return true;
    return false;
}

function getPayload(req) {
    return new Promise(resolve => {
        let body = [];
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            if (body.length > 0)
                if (req.headers['content-type'] == "application/json")
                    try { resolve(JSON.parse(body)); }
                    catch (error) { console.log(error); }
            resolve(null);
        });
    })
}

const server = createServer(async (req, res) => {
    console.log(req.method, req.url);
    accessControlConfig(req, res);
    if (!CORS_Preflight(req, res))
        if (!handleRequest(req, res)) {
            res.writeHead(404);
            res.end();
        }
});
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

