# 🚀 Saraswathi Tuition Centre — EC2 Deployment Guide

## What's included
```
saraswathi-backend/
├── server.js           ← Express backend (API + static file server)
├── package.json        ← Node.js dependencies
├── .env                ← Your secrets (Gmail password, admin key)
├── ecosystem.config.js ← PM2 config (keeps server running 24/7)
└── public/
    └── index.html      ← Your website
```

---

## STEP 1 — Connect to your EC2
```bash
ssh -i your-key.pem ec2-user@YOUR_EC2_IP
# or for Ubuntu:
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
```

---

## STEP 2 — Install Node.js (if not already installed)
```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs        # Amazon Linux
# OR for Ubuntu:
sudo apt-get install -y nodejs
```

Verify: `node -v` should show v20+

---

## STEP 3 — Upload your project files
From your **local machine**, run:
```bash
scp -i your-key.pem -r ./saraswathi-backend ec2-user@YOUR_EC2_IP:/home/ec2-user/
```

---

## STEP 4 — Install dependencies on EC2
```bash
cd /home/ec2-user/saraswathi-backend
npm install
```

---

## STEP 5 — Set up Gmail App Password
1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification** (if not already)
3. Search for **"App passwords"**
4. Create a new app password → select **Mail**
5. Copy the 16-character password

Then edit your `.env` file:
```bash
nano .env
```
Replace `your_16_char_app_password_here` with the actual password.

---

## STEP 6 — Open EC2 Security Group Port
In AWS Console:
1. Go to **EC2 → Security Groups**
2. Select your instance's security group
3. Add **Inbound Rule**:
   - Type: Custom TCP
   - Port: **3000**
   - Source: **0.0.0.0/0**

---

## STEP 7 — Install PM2 and start the server
```bash
sudo npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # follow the command it prints to auto-start on reboot
```

---

## STEP 8 — Update website API URL
Edit `public/index.html` and find this line near the bottom:
```javascript
const API_BASE = 'http://YOUR_EC2_IP:3000';
```
Replace `YOUR_EC2_IP` with your actual EC2 public IP, e.g.:
```javascript
const API_BASE = 'http://13.233.45.67:3000';
```

---

## STEP 9 — Test it!
- Website: `http://YOUR_EC2_IP:3000`
- Health check: `http://YOUR_EC2_IP:3000/api/health`

---

## VIEW ALL ENQUIRIES (Admin)
```bash
curl -H "x-admin-secret: saraswathi2026" http://YOUR_EC2_IP:3000/api/enquiries
```
Or open in browser with a tool like Postman / Thunder Client.

To change the admin password, edit ADMIN_SECRET in `.env`

---

## PM2 Useful Commands
```bash
pm2 status          # check if server is running
pm2 logs            # view live logs
pm2 restart all     # restart server
pm2 stop all        # stop server
```

---

## (Optional) Use a Domain + HTTPS
If you have a domain (e.g. saraswathituition.in):
1. Point your domain A record → EC2 IP
2. Install nginx: `sudo apt install nginx`
3. Install certbot for free SSL: https://certbot.eff.org
4. Then update `API_BASE` in index.html to `https://yourdomain.com`

---

## How Form Submission Works
1. Student fills the form → clicks Submit
2. Backend saves data to **enquiries.db** (SQLite on your EC2)
3. **Nodemailer** sends email to kboomipal@gmail.com with full details
4. Browser opens **WhatsApp** with pre-filled message to 9080894665
5. Success message shown to student ✅
# sarashwathi-tuition-centre
