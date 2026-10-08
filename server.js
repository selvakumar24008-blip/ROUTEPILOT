require('dotenv').config();
const express=require('express');
const cors=require('cors');
const jwt=require('jsonwebtoken');
const bcrypt=require('bcryptjs');
const Database=require('better-sqlite3');
const path=require('path');
const fs=require('fs');

const PORT=Number(process.env.PORT||10000);
const JWT_SECRET=process.env.JWT_SECRET||'dev-only-change-me';
const DB_FILE=process.env.DB_FILE||path.join(__dirname,'data','routepilot.db');
fs.mkdirSync(path.dirname(DB_FILE),{recursive:true});
const db=new Database(DB_FILE);
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS users(
 id TEXT PRIMARY KEY, role TEXT NOT NULL, name TEXT NOT NULL, phone TEXT DEFAULT '', email TEXT DEFAULT '', password_hash TEXT NOT NULL, active INTEGER DEFAULT 1, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS app_state(
 id INTEGER PRIMARY KEY CHECK(id=1), state_json TEXT NOT NULL, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS password_requests(
 id INTEGER PRIMARY KEY AUTOINCREMENT, role TEXT NOT NULL, user_id TEXT NOT NULL, name TEXT NOT NULL, note TEXT DEFAULT '', status TEXT DEFAULT 'OPEN', created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS audit_log(
 id INTEGER PRIMARY KEY AUTOINCREMENT, actor TEXT, message TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

const seedUsers=[
 ['owner','ow','Owner','','','Owner@123'],
 ['OP-01','op','Meena S.','','','Operator@123'],
 ['OP-02','op','Rajesh K.','','','Operator@123'],
 ['T-01','drv','Ravi','','','Driver@123'],['T-02','drv','Kumar','','','Driver@123'],['T-03','drv','Arun','','','Driver@123'],['T-04','drv','Senthil','','','Driver@123'],['T-05','drv','Vijay','','','Driver@123'],['T-06','drv','Mani','','','Driver@123'],['T-07','drv','Prakash','','','Driver@123'],['T-08','drv','Balu','','','Driver@123'],['T-09','drv','Karthik','','','Driver@123'],['T-10','drv','Selvam','','','Driver@123'],
 ['C-01','cu','Sri Kumaran Textiles','','','Customer@123'],['C-02','cu','Annapoorna Foods','','','Customer@123'],['C-03','cu','Kovai Pharma','','','Customer@123'],['C-04','cu','Tiruppur Knits','','','Customer@123'],['C-05','cu','Salem Steel Traders','','','Customer@123'],['C-06','cu','Erode Turmeric Co.','','','Customer@123'],['C-07','cu','Chennai Electronics','','','Customer@123'],['C-08','cu','Bengaluru Retail Hub','','','Customer@123'],['C-09','cu','Murugan Hardware','','','Customer@123'],['C-10','cu','Lakshmi Agro','','','Customer@123']
];
const insUser=db.prepare('INSERT OR IGNORE INTO users(id,role,name,phone,email,password_hash) VALUES(?,?,?,?,?,?)');
for(const u of seedUsers)insUser.run(u[0],u[1],u[2],u[3],u[4],bcrypt.hashSync(u[5],12));

function seedState(){
 const routes=[['R-101','Coimbatore','Tiruppur',48,'CLEAR',55],['R-102','Coimbatore','Erode',100,'CLEAR',130],['R-103','Coimbatore','Salem',160,'SLOW',200],['R-104','Coimbatore','Chennai',500,'CLEAR',480],['R-105','Coimbatore','Erode (via Perundurai)',112,'CLEAR',150],['R-106','Coimbatore','Bengaluru',365,'DISRUPTED',420],['R-107','Tiruppur','Salem',120,'CLEAR',150],['R-108','Erode','Salem',65,'CLEAR',80]].map(r=>({id:r[0],from:r[1],to:r[2],km:r[3],status:r[4],eta:r[5]}));
 const drivers=[['T-01','Ravi','IN_TRANSIT','R-101','Tiruppur',80],['T-02','Kumar','IN_TRANSIT','R-103','Salem',90],['T-03','Arun','AVAILABLE','Depot','Coimbatore',60],['T-04','Senthil','IN_TRANSIT','R-102','Perundurai',85],['T-05','Vijay','IN_TRANSIT','R-104','Chennai',70],['T-06','Mani','DELAYED','R-106','Bengaluru',95],['T-07','Prakash','IN_TRANSIT','R-102','Erode',75],['T-08','Balu','IN_TRANSIT','R-107','Tiruppur',65],['T-09','Karthik','AVAILABLE','Depot','Coimbatore',20],['T-10','Selvam','OFFLINE','Depot','Coimbatore',0]];
 const veh=drivers.map(v=>({id:v[0],driver:v[1],status:v[2],route:v[3],loc:v[4],cap:v[5],phone:'',email:''}));
 const cust=['Sri Kumaran Textiles','Annapoorna Foods','Kovai Pharma','Tiruppur Knits','Salem Steel Traders','Erode Turmeric Co.','Chennai Electronics','Bengaluru Retail Hub','Murugan Hardware','Lakshmi Agro'];
 const addr=['14, Kumaran Road, Tiruppur','27, Avinashi Road, Coimbatore','8, Trichy Road, Coimbatore','52, Mill Street, Tiruppur','31, Fairlands, Salem','19, Perundurai Road, Erode','90, Anna Salai, Chennai','66, MG Road, Bengaluru','23, Big Bazaar Street, Coimbatore','5, Market Road, Erode'];
 const cu=cust.map((name,i)=>({id:`C-${String(i+1).padStart(2,'0')}`,name,phone:'',address:addr[i]}));
 const dl=[]; for(let i=1;i<=20;i++){const route=['R-101','R-101','R-103','R-102','R-104','R-106','R-107','R-102'][ (i-1)%8]; const vehId=veh.find(v=>v.route===route)?.id||'T-01'; dl.push({id:`D-${100+i}`,cust:cust[(i-1)%10],phone:'',address:addr[(i-1)%10],pri:i===4?'CRITICAL':['NORMAL','HIGH','LOW','CRITICAL'][(i-1)%4],veh:vehId,route,dest:routes.find(r=>r.id===route).to,time:`${9+Math.floor((i-1)/3)}:${i%2?'30':'00'}`,status:'ON_TIME'});}
 return {routes,veh,del:dl,dis:[],log:[['09:05','🔴 Road R-106 landslide alert — Bengaluru highway'],['09:40','🟡 T-06 running 35 min late']],applied:false,acc:{owner:{id:'owner',name:'Owner',phone:'',email:''},ops:[{id:'OP-01',name:'Meena S.',phone:'',email:''},{id:'OP-02',name:'Rajesh K.',phone:'',email:''}],req:[],audit:[],inc:[],cu}};
}
if(!db.prepare('SELECT 1 FROM app_state WHERE id=1').get())db.prepare('INSERT INTO app_state(id,state_json) VALUES(1,?)').run(JSON.stringify(seedState()));

function state(){return JSON.parse(db.prepare('SELECT state_json FROM app_state WHERE id=1').get().state_json)}
function saveState(s){db.prepare('UPDATE app_state SET state_json=?,updated_at=CURRENT_TIMESTAMP WHERE id=1').run(JSON.stringify(s))}
function audit(actor,message){db.prepare('INSERT INTO audit_log(actor,message) VALUES(?,?)').run(actor,message)}
function tokenFor(u){return jwt.sign({sub:u.id,role:u.role,name:u.name},JWT_SECRET,{expiresIn:'12h'})}
function auth(req,res,next){try{const h=req.headers.authorization||'';if(!h.startsWith('Bearer '))throw 0;req.user=jwt.verify(h.slice(7),JWT_SECRET);next()}catch(e){res.status(401).json({error:'Authentication required'})}}
function canWrite(role){return ['ow','op'].includes(role)}

const app=express();app.use(cors());app.use(express.json({limit:'2mb'}));
app.get('/api/health',(req,res)=>res.json({ok:true,service:'RoutePilot API',time:new Date().toISOString()}));
app.post('/api/auth/login',(req,res)=>{const {role,id,password}=req.body||{};const u=db.prepare('SELECT * FROM users WHERE id=? AND role=? AND active=1').get(String(id||''),String(role||''));if(!u||!bcrypt.compareSync(String(password||''),u.password_hash))return res.status(401).json({error:'Incorrect ID or password'});audit(u.id,'logged in');res.json({token:tokenFor(u),user:{id:u.id,role:u.role,name:u.name,phone:u.phone,email:u.email}})});
app.get('/api/me',auth,(req,res)=>{const u=db.prepare('SELECT id,role,name,phone,email FROM users WHERE id=?').get(req.user.sub);res.json({user:u})});
app.get('/api/state',auth,(req,res)=>res.json({state:state()}));
app.put('/api/state',auth,(req,res)=>{if(!canWrite(req.user.role))return res.status(403).json({error:'Only owner/operator can change shared state'});saveState(req.body.state);audit(req.user.sub,'updated shared application state');res.json({ok:true})});
app.post('/api/password-requests',(req,res)=>{const {role,userId,name,note}=req.body||{};db.prepare('INSERT INTO password_requests(role,user_id,name,note) VALUES(?,?,?,?)').run(role,userId,name,note||'');const s=state();s.acc=s.acc||{};s.acc.req=s.acc.req||[];s.acc.req.push({role,who:userId,name,note:note||'',time:new Date().toLocaleString(),status:'OPEN'});saveState(s);audit('Public login',`requested password reset for ${userId}`);res.status(201).json({ok:true})});
app.get('/api/password-requests',auth,(req,res)=>{if(!canWrite(req.user.role))return res.status(403).json({error:'Forbidden'});res.json({requests:db.prepare('SELECT * FROM password_requests ORDER BY id DESC').all()})});
app.get('/api/audit',auth,(req,res)=>{if(req.user.role!=='ow')return res.status(403).json({error:'Owner only'});res.json({audit:db.prepare('SELECT * FROM audit_log ORDER BY id DESC LIMIT 500').all()})});
app.put('/api/users/:id/contact',auth,(req,res)=>{if(req.user.role!=='ow')return res.status(403).json({error:'Owner only'});const {phone='',email=''}=req.body||{};db.prepare('UPDATE users SET phone=?,email=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(phone,email,req.params.id);const s=state();const all=[s.acc?.owner,...(s.acc?.ops||[]),...(s.veh||[]),...(s.acc?.cu||[])].filter(Boolean);const x=all.find(x=>x.id===req.params.id);if(x){x.phone=phone;x.email=email;saveState(s)}audit(req.user.sub,`updated contact details for ${req.params.id}`);res.json({ok:true})});
app.post('/api/users/:id/password',auth,(req,res)=>{if(req.user.role!=='ow'&&req.user.role!=='op')return res.status(403).json({error:'Forbidden'});const {password}=req.body||{};if(!password||String(password).length<4)return res.status(400).json({error:'Password must be at least 4 characters'});const target=db.prepare('SELECT * FROM users WHERE id=?').get(req.params.id);if(!target)return res.status(404).json({error:'User not found'});if(req.user.role==='op'&&!['drv','cu'].includes(target.role))return res.status(403).json({error:'Operator can reset driver/customer only'});db.prepare('UPDATE users SET password_hash=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(bcrypt.hashSync(String(password),12),target.id);audit(req.user.sub,`reset password for ${target.id}`);res.json({ok:true})});
app.use(express.static(__dirname));
app.get('/{*splat}',(req,res)=>res.sendFile(path.join(__dirname,'index.html')));
app.listen(PORT,()=>console.log(`RoutePilot running on port ${PORT}`));
