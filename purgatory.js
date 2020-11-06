// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃                  Purgatory                  ┃
// ┃  Purges oldest directories from given path  ┃
// ┃  and archives them in specified folder      ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

var fs   = require('fs');
var path = require('path');

/* ------------------------------------ User config ----------------------------------- */
var mainDir       = "./testDir"             // Path to check for archiving
var archiveDir    = "./testDir/_archive";   // Path to place old content in
var excludeDirs   = ["_archive", "Foo"]     // Array of folders to exclude from archival
/* ------------------------------------------------------------------------------------ */

const maxFolders  = 10;                     // Maximum number of folders to keep [Excluded folders not enumerated]
var activeDirs    = []                      // Folders currently in main path
var toArchive     = []                      // Folders that need to be archived
var watchTimer    = Date.now();             // Time in future to wait until for next watch
var watchInterval = 2000;                   // ms to wait before next watch is valid

function purge(){
    console.log("running")
    //Fetch folders in main directory ("active dirs")
    fs.readdirSync(mainDir).forEach(dir => {
        if(excludeDirs.includes(dir)){return}                        // Skip excluded dirs
        var bTime = fs.statSync(path.join(mainDir,dir)).birthtimeMs  // Fetch creation date; 'birthTime' as epoch
        activeDirs.push({path:dir,birth:bTime}) 
    });
    
    //Sort folders by date created (descending)
    activeDirs = activeDirs.sort((a,b)=>{return b.birth - a.birth;})
    
    // Fetch older folders greater than max # allowed
    if(activeDirs.length>maxFolders){
        for (let i = maxFolders; i < activeDirs.length; i++) {
            var dir = activeDirs[i];
            toArchive.push(dir.path)
        }
    
        console.warn(`\nPurging the following folders to ${archiveDir}: `);

        toArchive.forEach(d => {
            process.stdout.write(`| ${d} `)
        });
        process.stdout.write(`|\n`)
    
        //Create the archive folder if it doesn't exist
        if(!fs.existsSync(archiveDir)){fs.mkdirSync(archiveDir)}
    
        toArchive.forEach(d => {
            try {
                fs.renameSync(path.join(mainDir,d),path.join(archiveDir,d),(err)=>{
                    console.error("There was an error moving the folder: \n",err)
                })    
            } catch (error) {
                console.error(error)
                return
            }
        });
    }else{
        console.log("Nothing to do.")
    }
}



/* ---------------------------------- Folder watching --------------------------------- */
// fs.watch Currently bugged on Windows apparently 🙄

// fs.watch(mainDir,(event,fName)=>{
//     var curTime = Date.now()
//     if(event=='change' && curTime>watchTimer){
//         console.log(`${event} at ${fName}`);
//         purge();
//         watchTimer = curTime+watchInterval
//     }
// })


/* -------------------------------- Run once every hour ------------------------------- */
purge();
setInterval(purge,3600000);