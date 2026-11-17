import {authorized} from './auth.js';

export default function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  const authenticated=authorized(req);
  return res.status(authenticated?200:401).json({authenticated});
}
