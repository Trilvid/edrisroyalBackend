const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const mongoose = require('mongoose')
const User = require('./models/user.model')
const Loan = require('./models/loan')
const Admin = require('./models/admin')
const jwt = require('jsonwebtoken')
const path = require('path')
var serveStatic = require('serve-static')
const Token = require('./models/token')
const crypto = require('crypto')
const P2p = require('./models/p2p')
dotenv.config()

const app = express()

app.use(cors())
// app.options('*', cors())

// app.use((req, res, next) => {
//   res.header({ "Access-Control-Allow-Origin": "*" });
//   next();
// })

app.use(serveStatic(path.join(process.cwd(), '/dist')))
app.get(
  [
    // '/',
    // '/dashboard',
    // '/myprofile',
    '/login',
    '/openaccount',
    // '/transfer',
    // '/link_to_bank',
    // '/profile',
    // '/admin',
    // '/transactions',
    // '/scan_cheque',
    '/accounts',
    '/digitalbanking',
    '/cards',
    '/loan',
    '/insurance',
    '/security'
  ],
  (req, res) => res.sendFile(path.join(process.cwd(), '/dist/index.html'))
)
app.use('/static', express.static('dist/static'))

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

const port = process.env.PORT || 5100

app.use(express.json())

mongoose.set('strictQuery', false)
mongoose.connect(process.env.ATLAS_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB', error);
  });
// mongoose.connect(process.env.ATLAS_URI, console.log('database is connected'))

app.get('/api/verify', async (req, res) => {
  const token = req.headers['x-access-token']
  try {
    const decode = jwt.verify(token, 'secret1258')
    const email = decode.email
    const user = await User.findOne({ email: email })
    if (user.rememberme === true) {
      res.json({
        status: 'ok',
      })
    }
    else {
      res.json({
        status: 'false',
      })
    }
  } catch (error) {
    res.json({ status: `error ${error}` })
  }
})

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  })
};

const success = (statusCode, res, user, message) => {
  const token = createToken(user.id);
  const url = `${process.env.BASE_URL}auth/${user._id}/verify/${token}`;

  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    // secure: req.secure || req.headers['x-access-token'] === 'http'
  });

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    role: user.role,
    message,
    url,
    user
  });
}



app.post('/api/v1/register', async (req, res) => {
  const email = req.body.email;
  
  const generatedNumber =  () => {
    let number = '4';
    
    for (let i = 0; i < 11; i++) {
      number += Math.floor(Math.random()*10);
    }
    return number;
  }
  const acct = generatedNumber()
  
  const generateRoutingNo =  () => {
    let number = '2';
    
    for (let i = 0; i < 8; i++) {
      number += Math.floor(Math.random()*8);
    }
    return number;
  }
  const routingNo = generateRoutingNo()
  
  console.log(`Generated 12-digit number: ${acct}`);
  

  try {
    const user = await User.findOne({ email: email })

    if (user) {
      console.log('user already exists')
      return res.json({
        status: 'bad',
        message: 'Invalid email or user already exists'
      })
    }
    else {

    const newUser = await User.create({
    fullname: req.body.fullname,
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
    mothername: req.body.mothername,
    ssn: req.body.ssn,
    address: req.body.address,
    country: req.body.country,
    taxid: req.body.taxid,
    postalcode: req.body.postalcode,
    phonenumber: req.body.phonenumber,
    city: req.body.city,
    accountNo: `${acct}`,
    role: 'user',
    routingno: `${routingNo}`
  })

    const token = createToken(newUser.id);
    const url = `${process.env.BASE_URL}users/${newUser._id}/verify/${token}`

    return res.json({
      status: 'ok',
      newUser,
      url
    })
  }

  } catch (error) {
    console.log(error)
    res.send(error)
  }

})

app.get('/:id/verify/:token', async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id })
    if (!user) {
      return res.json({ status: 400 })
    }
    else {
      await User.updateOne({ _id: user._id }, {
        $set: { verified: true }
      })
      res.json({ status: 200 })
    }
    // const token = await Token.findOne({userId:user._id,token:req.params.token})

    // if(!token){
    //   return res.json({status:400})
    // }
    // await User.updateOne({_id:user._id},{
    //   $set:{verified:true}
    // })
    // await token.remove()
    // res.json({status:200})
  } catch (error) {
    console.log(error)
    res.json({ status: `internal server error ${error}` })
  }
})

app.get('/api/getData', async (req, res) => {
  const token = req.headers['x-access-token']
  try {
    const decode = jwt.verify(token, 'secret1258')
    const email = decode.email
    const user = await User.findOne({ email: email })
    res.json({
      status: 'ok',
      fullname: user.fullname,
      username: user.username,
      email: user.email,
      balance: user.balance,
      transaction: user.transaction,
      cheque: user.scan_cheque,
      phonenumber: user.phonenumber,
      city: user.city,
      postalcode: user.postalcode,
      address: user.address,
      profilepicture: user.profilepicture,
      country: user.country,
      role: user.role,
      accountverification: user.accountverification,
      accountNo: user.accountNo,
      pin: user.pin,
      faceId: user.faceId,
      dlfront: user.dlfront,
      routeNo: user.routingno
    })
  } catch (error) {
    res.json({ status: 'error', message: error.message })
  }
})

app.patch('/api/updateUserPassword', async (req, res) => {
  const token = req.headers['x-access-token']
  try {
    const decode = jwt.verify(token, 'secret1258')
    const email = decode.email
    const user = await User.findOne({ email: email })

    if (user.password !== req.body.currentPass) {
      return res.json({ status: 400, message: "invaild password" })
    }
    else {
        await User.updateOne({
          email: user.email
        }, {
          $set: {
            password: req.body.password
          }
        })
      console.log({
        msg: "hello dear i want to validate this data",
        image: user.password
      })
      return res.json({ status: 200, message: "password reset successful" })
    }
  } catch (error) {
    console.log(error)
    return res.json({ status: 500, message: "Something went wrong, please try again later" })
  }
})

app.post('/api/updateUserData', async (req, res) => {
  const token = req.headers['x-access-token']
  try {
    const decode = jwt.verify(token, 'secret1258')
    const email = decode.email
    const user = await User.findOne({ email: email })

    if (user && req.body.profilepicture !== undefined) {
      if (user.phonenumber !== req.body.phonenumber || user.state !== req.body.state || user.profilepicture !== req.body.profilepicture) {
        await User.updateOne({
          email: user.email
        }, {
          $set: {
            phonenumber: req.body.phonenumber,
            profilepicture: req.body.profilepicture,
            state: req.body.state,
            zipcode: req.body.zipcode,
            country: req.body.country,
            address: req.body.address,
            fullname: req.body.fullname,
            username: req.body.username
          }
        })
      }
      return res.json({ status: 200 })
    }
    else {
      console.log({
        msg: "hello dear i want to validate this",
        image: user.profilepicture
      })
      return res.json({ stauts: 400, profile: user.profilepicture })
    }
  } catch (error) {
    console.log(error)
    return res.json({ status: 500 })
  }
})

app.post('/api/transferdet', async (req, res) => {
  const receiver = req.body.accountNo
  // console.log(receiver)
  if(receiver !== Number) {
    // console.log({receiver, msg: "not a no"})
  }

  const result = await User.findOne({accountNo: receiver})
  if(!result) {
    // console.log("invalid account details ma")
    return res.json({status: 400, message: "invalid banking details"})
  }
  else {
  console.log(result.fullname)
  return res.json({
    status: 200,
    name: result.fullname
  })
}
})


app.post('/api/transfer', async (req, res) => {
  const token = req.headers['x-access-token']
  try {
    const decode = jwt.verify(token, 'secret1258')
    const email = decode.email
    const user = await User.findOne({ email: email })
    const now = new Date()
    
    const receiver = req.body.accountNo
    const pin = req.body.pin
    const amount = req.body.amount
    const person = await User.findOne({ accountNo: req.body.accountNo})
    const creditBal = person.balance + parseInt(amount)
    const debitBal = user.balance - parseInt(amount)

    if (parseInt(receiver) === user.accountNo) {
      return res.json({
        status: 400,
        message: "Sorry you cannot perform this action"
      })
    }
    else if (!person) {
      console.log("Invaild account number")
      return res.json({ stauts: 400, message: "invaild banking details" })
    }
    else {
      if (pin === user.pin) {
        await User.updateOne({
          email: user.email
        }, {
          $set: {
              balance: debitBal
          },
          $push: {
            transaction: {
              type: 'debit',
              amount: req.body.amount,
              date: now.toLocaleString(),
              balance: user.balance - amount,
              id: crypto.randomBytes(8).toString('hex'),
            },
          },
        })
        await User.updateOne({
          accountNo: receiver
        }, {
          $set: {
              balance: creditBal
          },
          $push: {
            transaction: {
              type: 'credit',
              amount: req.body.amount,
              date: now.toLocaleString(),
              balance: user.balance + amount,
              id: crypto.randomBytes(8).toString('hex'),
            },
          },
        })
      return res.json({ status: 200, message: `Transfer successful`})
      }
      else {
        return res.json({
          status: 400,
          message: "Incorrect pin"
        })
      }
    }
  } catch (error) {
    console.log({error, msg: error.message})
    return res.json({ status: 500, message: "Something went wrong please check internet connection and try again" })
  }
})

// setting up the pin
app.patch('/api/pinsetup', async (req, res) => {
  const token = req.headers['x-access-token']
  try {
    const decode = jwt.verify(token, 'secret1258')
    const email = decode.email
    const user = await User.findOne({ email: email })

    if (!user) {
      console.log({
        msg: "sth went wrong please check internet connection"
      })
      return res.json({ stauts: 400, message: "sorry, please try again later" })
    }

    else {

      if (req.body.pin !== "") {
        await User.updateOne({
          email: user.email
        }, {
          $set: {
            pin: req.body.pin,
            // accountverification: true
          }
        })
      }
      return res.json({ status: 200, message: 'Updated successfully' })
    }
  } catch (error) {
    console.log(error)
    return res.json({ status: 500, message: "something went wrong please check internet connection and try again" })
  }
})


app.patch('/api/scancheque', async (req, res) => {
  const token = req.headers['x-access-token']
  try {
    const decode = jwt.verify(token, 'secret1258')
    const email = decode.email
    const user = await User.findOne({ email: email })

    console.log({
      front: req.body.showImage,
      back: req.body.showImage2
    })
    const now = new Date()
    
    if (req.body.showImage === undefined) {
      return res.json({ status: 400, message: 'Sorry no Internet Connection' })
    }

   else if (!user) {
      console.log({
        msg: "sth went wrong please check internet connection"
      })
      return res.json({ stauts: 400, message: "sorry, please try again later" })
    }

    else {
      if (req.body.showImage !== "" && req.body.showImage2 !== "") {
        await User.updateOne({
          email: user.email
        }, {
          $push: {
            scan_cheque: {
              id: crypto.randomBytes(6).toString('hex'),
              status: 'pending',
              front: req.body.showImage,
              back: req.body.showImage,
              date: now.toLocaleString(),
            }
          }
        })
      }
      return res.json({ status: 200, message: 'Cheque Scanned successfully' })
    }
  } catch (error) {
    console.log(error)
    return res.json({ status: 500, message: "something went wrong please check internet connection and try again" })
  }
})

app.patch('/api/uploaddriverlincense', async (req, res) => {
  const token = req.headers['x-access-token']
  try {
    const decode = jwt.verify(token, 'secret1258')
    const email = decode.email
    const user = await User.findOne({ email: email })

    console.log({
      front: req.body.showImage,
      back: req.body.showImage2
    })
    
    if (req.body.showImage === undefined) {
      return res.json({ status: 400, message: 'Sorry no Internet Connection' })
    }

   else if (!user) {
      console.log({
        msg: "sth went wrong please check internet connection"
      })
      return res.json({ stauts: 400, message: "sorry, please try again later" })
    }

    else {
      if (req.body.showImage !== "" && req.body.showImage2 !== "") {
        await User.updateOne({
          email: user.email
        }, {
          $set: {
            dlfront: req.body.showImage,
            dlback: req.body.showImage2,
          }
        })
      }
      return res.json({ status: 200, message: 'Updated successfully' })
    }
  } catch (error) {
    console.log(error)
    return res.json({ status: 500, message: "something went wrong please check internet connection and try again" })
  }
})

app.patch('/api/uploadface_id', async (req, res) => {
  const token = req.headers['x-access-token']
  try {
    const decode = jwt.verify(token, 'secret1258')
    const email = decode.email
    const user = await User.findOne({ email: email })

    console.log({
      front: req.body.showImage,
      email
    })
    
    if (req.body.showImage === undefined) {
      return res.json({ status: 400, message: 'Sorry no Internet Connection' })
    }

   else if (!user) {
      console.log({
        msg: "sth went wrong please check internet connection"
      })
      return res.json({ stauts: 400, message: "sorry, please try again later" })
    }

    else {
      if (req.body.showImage !== "") {
        await User.updateOne({
          email: user.email
        }, {
          $set: {
            faceId: req.body.showImage
          }
        })
      }
      return res.json({ status: 200, message: 'Updated successfully' })
    }
  } catch (error) {
    console.log(error)
    return res.json({ status: 500, message: "something went wrong please check internet connection and try again" })
  }
})

app.post('/api/fundwallet', async (req, res) => {
  try {
    const email = req.body.email
    const incomingAmount = req.body.amount
    const user = await User.findOne({ email: email })
    await User.updateOne(
      { email: email }, {
      $set: {
        funded: incomingAmount + user.funded,
        capital: user.capital + incomingAmount,
        totaldeposit: user.totaldeposit + incomingAmount
      }
    }
    )
    await User.updateOne(
      { email: email },
      {
        $push: {
          deposit: {
            date: new Date().toLocaleString(),
            amount: incomingAmount,
            id: crypto.randomBytes(32).toString("hex"),
            balance: incomingAmount + user.funded
          }
        }, transaction: {
          type: 'Deposit',
          amount: incomingAmount,
          date: new Date().toLocaleString(),
          balance: incomingAmount + user.funded,
          id: crypto.randomBytes(32).toString("hex"),
        }
      }
    )
    res.json({ status: 'ok', funded: req.body.amount, name: user.firstname, email: user.email })
  } catch (error) {
    console.log(error)
    res.json({ status: 'error' })
  }
})

// app.post('/api/admin', async (req, res) => {
//   const admin = await Admin.findOne({ email: req.body.email })
//   if (admin) {
//     return res.json({ status: 200 })
//   }
//   else {
//     return res.json({ status: 400 })
//   }
// })


app.post('/api/deleteUser', async (req, res) => {
  try {
    await User.deleteOne({ email: req.body.email })
    return res.json({ status: 200 })
  } catch (error) {
    return res.json({ status: 500, msg: `${error}` })
  }
})

app.post('/api/withdraw', async (req, res) => {
  const token = req.headers['x-access-token']
  try {
    const decode = jwt.verify(token, 'secret1258')
    const email = decode.email
    const user = await User.findOne({ email: email })
    if (user.totalprofit >= req.body.WithdrawAmount) {
      await User.updateOne(
        { email: email },
        { $set: { funded: user.funded - req.body.WithdrawAmount, totalwithdraw: user.totalwithdraw + req.body.WithdrawAmount, capital: user.capital - req.body.WithdrawAmount } }
      )
      await User.updateOne(
        { email: email },
        {
          $push: {
            withdraw: {
              date: new Date().toLocaleString(),
              amount: req.body.WithdrawAmount,
              id: crypto.randomBytes(32).toString("hex"),
              balance: user.funded - req.body.WithdrawAmount
            }
          }
        }
      )
      const now = new Date()
      await User.updateOne(
        { email: email },
        {
          $push: {
            transaction: {
              type: 'withdraw',
              amount: req.body.WithdrawAmount,
              date: now.toLocaleString(),
              balance: user.funded - req.body.WithdrawAmount,
              id: crypto.randomBytes(32).toString("hex"),
            }
          }
        }
      )

      res.json({ status: 'ok', withdraw: req.body.WithdrawAmount, name: user.firstname, email: user.email })
    }
    else if (new Date().getTime() - user.withdrawDuration >= 1728000000 && user.withdrawDuration !== 0 && user.capital < req.body.WithdrawAmount) {
      await User.updateOne(
        { email: email },
        { $set: { funded: user.funded - req.body.WithdrawAmount, totalwithdraw: user.totalwithdraw + req.body.WithdrawAmount, capital: user.capital - req.body.WithdrawAmount } }
      )
      await User.updateOne(
        { email: email },
        {
          $push: {
            withdraw: {
              date: new Date().toLocaleString(),
              amount: req.body.WithdrawAmount,
              id: crypto.randomBytes(32).toString("hex"),
              balance: user.funded - req.body.WithdrawAmount
            }
          }
        }
      )
      const now = new Date()
      await User.updateOne(
        { email: email },
        {
          $push: {
            transaction: {
              type: 'withdraw',
              amount: req.body.WithdrawAmount,
              date: now.toLocaleString(),
              balance: user.funded - req.body.WithdrawAmount,
              id: crypto.randomBytes(32).toString("hex"),
            }
          }
        }
      )
      res.json({ status: 'ok', withdraw: req.body.WithdrawAmount })
    }
    else {
      res.json({ status: 400, message: 'insufficient Amount! You cannot withdraw from your capital yet. you can only withdraw your profit after the first 20 days of investment, Thanks.' })
    }
  }
  catch (error) {
    console.log(error)
    res.json({ status: 'error', message: 'internal server error' })
  }
})

app.post('/api/sendproof', async (req, res) => {
  const token = req.headers['x-access-token']
  try {
    const decode = jwt.verify(token, 'secret1258')
    const email = decode.email
    const user = await User.findOne({ email: email })

    if (user) {
      return res.json({ status: 200, name: user.firstname, email: user.email })
    }
    else {
      return res.json({ status: 500 })
    }
  } catch (error) {
    res.json({ status: 404 })
  }
})


app.post('/api/login', async (req, res) => {
  const user = await User.findOne({
    email: req.body.email,
  })
  if (user) {
    if (user.password !== req.body.password) {
      return res.json({ status: 404, })
    }
    else if (user.verified) {
      const token = jwt.sign(
        {
          email: user.email,
          password: user.password
        },
        'secret1258'
      )
      await User.updateOne({ email: user.email }, { $set: { rememberme: req.body.rememberme } })
      return res.json({ status: 'ok', user: token, role: user.role })
    }
    else {
      return res.json({ status: 400 })
    }
  }

  else {
    return res.json({ status: 'error', user: false })
  }
})






app.get('/api/getp2pdata', async (req, res) => {
  const data = await P2p.findOne({ _id: '6673f68dc78c107db578322b' })
  return res.json({ status: 'ok', data })
})

app.patch('/api/p2pdetails', async (req, res) => {
  const hey = await P2p.updateOne(
    { _id: '66745f3cb05f4c8937b711e0' },
    {
      $set: {
        price: req.body.price,
        accountNo: req.body.accountNo,
        accountName: req.body.accountName,
        bankName: req.body.bankName
      }
    })
  // 66745f3cb05f4c8937b711e0
  console.log(hey)
  return res.send(hey)
})

app.post('/api/only_v3/p2pcreate', async (req, res) => {
    
    const hey = await P2p.create({
      price: req.body.price,
      accountNo: req.body.accountNo,
      accountName: req.body.accountName,
      bankName: req.body.bankName
    })
    
  console.log(hey)
  return res.send(hey)
})


app.post('/api/loan', async (req, res) => {
  const token = req.headers['x-access-token']
  try {
    const decode = jwt.verify(token, 'secret1258')
    const email = decode.email
    const user = await User.findOne({ email: email })

    const loanAmt = req.body.loanAmount;
    const bal = loanAmt + user.loanAmt;

    console.log({
      loanAmt: req.body.loanAmount,
      loanDesc: req.body.description
    })

    if (user.loanStatus === 'pending') {
      return res.json({
        status: 'bad',
        message: "sorry your preivous loan is still been processed, Please try again later"
      })
    }
    else if (user.capital < 1000) {
      return res.json({
        status: 'bad',
        message: 'You are not eligible for this loan, Please fund your account to continue.'
      })
    }
    else {
      const applyLoan = await User.updateOne(
        { email: email },
        {
          $set: {
            loanAmt: bal,
            loanDesc: req.body.description,
            loanStatus: 'pending',
          },
          $push: {
            transaction: {
              type: 'Loan',
              amount: loanAmt,
              date: new Date().toLocaleString(),
              balance: loanAmt + user.funded,
              id: crypto.randomBytes(10).toString("hex"),
            }
          }
        }
      );
      // await Loan.create({
      //   loanAmount: req.body.loanAmount,
      //   loanDesc: req.body.description,
      //   loanBalance: +req.body.loanAmount,
      //   user: user.id
      // })
      if (applyLoan) {
        return res.json({
          status: 'ok',
          message: "Your have successfully applied for this loan",
          name: user.firstname,
          email: user.email
        })
      }
      else {
        return res.json({
          status: 'bad',
          message: "Sorry an error occured, please try again later"
        })
      }
    }
  } catch (error) {
    res.json({ status: 404 })
    console.log(error)
  }
})

app.post('/api/p2ptran', async (req, res) => {
  const token = req.headers['x-access-token']
  try {
    const decode = jwt.verify(token, 'secret1258')
    const email = decode.email
    const user = await User.findOne({ email: email })

    const convertedAmt = req.body.convertTo;

    console.log({
      loanDesc: req.body.convertTo
    })

    await User.updateOne(
      { email: email }, {
      $set: {
        // funded: convertedAmt + user.funded,
        // capital :user.capital + convertedAmt,
        totaldeposit: user.totaldeposit + convertedAmt
      },
    })

    await User.updateOne(
      { email: email },
      {
        $push: {
          deposit: { 
            date: new Date().toLocaleString(),
            amount: convertedAmt,
            id: crypto.randomBytes(8).toString("hex"),
            balance: convertedAmt + user.funded
          }
        }, transaction: {
          type: 'P2p Deposit',
          amount: convertedAmt,
          date: new Date().toLocaleString(),
          balance: convertedAmt + user.funded,
          id: crypto.randomBytes(8).toString("hex"),
        }
      }
    )
    res.json({ status: 'ok', funded: req.body.convertedAmt, name: user.name, email: user.email })

  } catch (error) {
    console.log(error)
    res.json({ status: 'error' })
  }

})

// omo i am towork on this shitty thing again ooh God


app.patch('/api/userloan', async (req, res) => {
  // hello this is usersloan
  try {

    const email = req.body.email;
    const user = await User.findOne({ email: email })

    console.log({
      loanemail: email,
      loanDesc: "yh sure to send an email to the admin"
    })

    if(user.loanStatus === 'pending') {
    const first = await User.updateOne(
      { email: email },{
      $set : {
        loanStatus: "approved",
        funded: user.loanAmt + user.funded,
        capital: user.capital + user.loanAmt
      }
    }
    )
    if(first) {
      console.log("done the first part of the job")
      await User.updateOne(
        { email: email },{
        $set : {
          loanAmt: 0
        }
      }
      )
    }
    
    res.json({ status: 'ok', message: "Your loan has been approved"})
    }
    else {
      res.json({
        status: 400,
        message: "No pending loan application"
      })
    }
  } catch (error) {
    console.log(error)
    res.json({ status: 'error' })
  }
})


app.get('/api/getUsers', async (req, res) => {
  // const users = await User.find()
  const users = await User.find({ role: "user" });
  res.json(users)
})


app.get('/api/getuserstat', async (req, res) => {
  // hello i am right here
  const users = await User.find({ role: "user" });
  const verified = await User.find({ role: "user", verified: "true" });
  const unverified = await User.find({ role: "user", verified: "false" });


  return res.json({ users: users.length, verify: verified.length, unverified: unverified.length })
})


app.post('/api/invest', async (req, res) => {
  const token = req.headers['x-access-token'];
  try {
    const decode = jwt.verify(token, 'secret1258');
    const email = decode.email;
    const user = await User.findOne({ email: email });
    // const HOURS_IN_A_DAY = 24;


    const calculateDurationInMilliseconds = (durationInDays) => {
      const millisecondsInADay = 24 * 60 * 60 * 1000;
      return durationInDays * millisecondsInADay;
    };

    const calculateProfit = (amount, percent) => {
      const Fv = (amount) * (1 + percent/100)^durationInDays 
      const Pv = Fv - amount
      console.log(Pv)
      return Pv;
      // return (amount * 1 + percent) / 100;
    };

    const durations = {
      '24h': 1,
      '48h': 2,
      '72h': 3,
      'daily': 5,
      '15d': 15,
      '30d': 30,
    };

    const duration = req.body.duration;
    const percent = req.body.percent;

    if (!percent) {
      console.log(duration)
      console.log(percent)
      return res.status(400).json({
        message: 'Invalid duration or percentage provided.',
      });
    }


    const durationInDays = durations[duration];
    const durationInMilliseconds = calculateDurationInMilliseconds(durationInDays);
    const profitPercent = parseFloat(percent.replace('%', ''));

    const profit = calculateProfit(req.body.amount, profitPercent);


    if (user.capital >= req.body.amount) {
      const now = new Date();
      const endDate = new Date(now.getTime() + durationInMilliseconds);
      await User.updateOne(
        { email: email },
        {
          $push: {
            investment: {
              type: 'investment',
              amount: req.body.amount,
              plan: req.body.plan,
              percent: req.body.percent,
              startDate: now.toLocaleString(),
              endDate: endDate.toLocaleString(),
              profit: profit,
              ended: endDate.getTime(),
              started: now.getTime(),
              periodicProfit: 0,
            },
            transaction: {
              type: 'investment',
              amount: req.body.amount,
              date: now.toLocaleString(),
              balance: user.funded,
              id: crypto.randomBytes(10).toString('hex'),
            },
          },
        }
      );
      await User.updateOne(
        { email: email },
        {
          $set: {
            capital: user.capital - req.body.amount,
            totalprofit: user.totalprofit + profit,
            withdrawDuration: now.getTime(),
          },
        }
      );
      return res.json({
        status: 'ok',
        amount: req.body.amount,
        name: user.firstname,
        email: user.email,
        periodicProfit: user.periodicProfit,
      });
    } else {
      return res.status(400).json({
        message: 'You do not have sufficient funds in your account.',
      });
    }
  } catch (error) {
    return res.status(500).json({ status: 500, error: error });
  }
});


const changeInvestment = async (user, now) => {
  const updatedInvestments = user.investment.map(async (invest) => {
    if (isNaN(invest.started)) {
      return invest;
    }
    if (now - invest.started >= invest.ended) {
      return invest;
    }
    if (isNaN(invest.profit)) {
      return invest;
    }
    const profit = Math.round(10 / 100 * invest.profit);
    await User.updateOne(
      { email: user.email, 'investment._id': invest._id },
      {
        $set: {
          funded: user.funded + profit,
          periodicProfit: user.periodicProfit + profit,
          capital: user.capital + profit,
          'investment.$.profit': profit,
        },
      }
    );
    return {
      ...invest,
      profit: profit,
    };
  });
  return Promise.all(updatedInvestments);
};

app.get('/api/cron', async (req, res) => {
  try {
    mongoose.connect(process.env.ATLAS_URI)
    const users = (await User.find()) ?? []
    const now = new Date().getTime()
    // changeInvestment(users, now)

    for (const user of users) {
      const updatedInvestments = await changeInvestment(user, now);
      await User.updateOne(
        { email: user.email },
        {
          $set: {
            investment: updatedInvestments,
          },
        }
      );
    }
    return res.json({ status: 200 })
  } catch (error) {
    console.log(error)
    return res.json({ status: 500 })
  }
})


module.exports = app