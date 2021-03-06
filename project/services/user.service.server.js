var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var bcrypt = require("bcrypt-nodejs");

module.exports = function (app, models) {

    var userModel = models.userModel;
    var locationModel = models.locationModel;

    app.post("/api/userP", createUser);
    app.get("/api/userP/:userId", findUserById);
    app.post("/api/loginP",passport.authenticate('local.two'), login);
    app.get ('/auth/google', passport.authenticate('google', { scope : ['profile', 'email']}));
    app.post('/api/logoutP', logout);
    app.post('/api/registerP', register);
    app.get('/api/isLoggedInP', isLoggedIn);
    app.get("/api/userP", findUser);
    app.put("/api/userP/:userId", updateUser);
    app.delete("/api/userP/:userId", deleteUser);
    app.post("/api/userP/:userId/addlocation", addLocationForUser);
    app.get("/api/userP/:userId/all", findAllUsers);
    app.post("/api/userP/:userId/addUser", addUserForUser);
    app.delete("/api/userP/:userId/removeUser/:friendId", removeUserFromUser);

    app.get('/auth/google/callback',
        passport.authenticate('google', {
            successRedirect: '/project/#/user',
            failureRedirect: '/project/#/login'
        }));

    var googleConfig = {
        clientID     : process.env.GOOGLE_CLIENT_ID,
        clientSecret : process.env.GOOGLE_CLIENT_SECRET,
        callbackURL  : process.env.GOOGLE_CALLBACK_URL
    };

    passport.use('local.two',new LocalStrategy(localStrategyProj));
    passport.use(new GoogleStrategy(googleConfig, googleStrategyProj));




    passport.serializeUser(serializeUser);
    passport.deserializeUser(deserializeUser);

    function localStrategyProj(username, password, done) {
        userModel
            .findUserByUsername(username)
            .then(
                function (user) {
                    if(user &&   bcrypt.compareSync(password, user.password)) {
                        done(null, user);
                    } else {
                        done(null, false);
                    }
                },
                function(err) {
                    done(err);
                }
            )
            .catch(function (error) {
                console.log(error);
            })
    }

    function googleStrategyProj(token, refreshToken, profile, done) {
        userModel
            .findUserByGoogleId(profile.id)
            .then(function (googleUser) {
                if(googleUser) {
                   return googleUser;
                }
                else {

                    var email = profile.emails[0].value;
                    var emailSplits = email.split("@");
                    var newGoogleUser = {
                        username:  emailSplits[0],
                        firstName: profile.name.givenName,
                        lastName:  profile.name.familyName,
                        email:     email,
                        google: {
                            id:    profile.id,
                            token: token
                        }
                    };
                    return userModel.createUser(newGoogleUser);
                }
            }, function (err) {
                done(err, null);
            })
            .then(function (googleUser) {
                done(null, googleUser);
            }, function (err) {
                done(err, null);
            });
    }

    function serializeUser(user, done) {
        done(null, user);
    }

    function deserializeUser(user, done) {
        userModel
            .findUserById(user._id)
            .then(
                function(user){
                    done(null, user);
                },
                function(err){
                    done(err, null);
                }
            );
    }

    function login(req, res) {
        var user = req.user;
        res.json(user);
    }

    function logout(req, res) {
        req.logOut();
        res.send(200);
    }

    function register(req, res) {
        var newUser = req.body;
        newUser.password = bcrypt.hashSync(newUser.password);
        userModel
            .createUser(newUser)
            .then(function (user) {
                req.login(user, function (err) {
                    if(!err){
                        console.log(req);
                        res.json(user);
                    }
                    else {
                        res.status(400).send(err);
                    }
                })

            })
            .catch(function (error) {
                res.status(400).send();
            });
    }

    function isLoggedIn(req, res) {
        if(req.isAuthenticated()) {
            res.json(req.user);
        } else {
            res.send('0');
        }
    }

    function createUser(req, res) {
        var newUser = req.body;
        userModel
            .createUser(newUser)
            .then(function (user) {
                res.json(user);
            })
            .catch(function (error) {
                res.status(400).send();
            });
    }

    function findUserById(req, res) {
        var uid = req.params.userId;
        userModel
            .findUserById(uid)
            .then(function (user) {
                res.send(user);
            })
            .catch(function (error) {
                res.status(404).send(error);
            })
    }

    function findUser(req, res) {
        var username = req.query.username;
        var password = req.query.password;
        if (username && password) {
            findUserByCredentials(username, password, res);
        } else if (username) {
            findUserByUsername(username, res);
        } else {
            res.status(400).send();
        }
    }

    function findUserByCredentials(username, password, res) {
        userModel
            .findUserByCredentials(username, password)
            .then(function (user) {
                res.send(user);
            })
            .catch((function (error) {
                res.status(404).send(error);
            }))

    }

    function findUserByUsername(username, res) {
        userModel
            .findUserByUsername(username)
            .then(function (user) {
                res.send(user);
            })
            .catch(function (error) {
                res.status(400).send(error)
            });
    }

    function updateUser(req, res) {
        var userId = req.params.userId;
        var user = req.body;
        delete user._id;
        userModel
            .updateUser(user, userId)
            .then(function (response) {
                res.send(response);
            })
            .catch(function (error) {
                res.status(400).send(error);
            })

    }

    function deleteUser(req, res) {
        var userId = req.params.userId;
        var userLocations = [];
        userModel
            .findUserById(userId)
            .then(function (user) {
                user.locations.forEach(function (location) {
                    userLocations.push(location._id);
                });
                return locationModel
                    .removeUserFromLocations(userId, userLocations);
            },
            function (err) {
                   return err;
            })
            .then(function (response) {
                return locationModel.
                           deleteLocationsWithNoUsers();
            },function (err) {
                return err;
            })
            .then(function (response) {
                return userModel
                    .deleteUser(userId);
            }, function (err) {
                return err
            })
            .then(function (response) {
                res.status(200).send();
            }, function (err) {
                res.status(400).send();
            });
        
    }
    
    function addLocationForUser(req, res) {
        var userId = req.params.userId;
        var location = req.body;
        userModel.
            addLocationForUser(userId, location, res);
    }

    function findAllUsers(req, res) {
        userModel
            .findAllUsers()
            .then(function (users) {
                res.send(users);
            }, function (err) {
                res.status(400).send(err);
            });
    }

    function addUserForUser(req, res) {
        var userId = req.params.userId;
        var user = req.body;
        userModel
            .addUserForUser(userId, user)
            .then(function (response) {
                res.status(200).send();
            }, function (err) {
                res.status(400).send();
            });
    }


    function removeUserFromUser(req, res) {
        var userId = req.params.userId;
        var friendId = req.params.friendId;
        userModel
            .removeUserFromUser(userId, friendId)
            .then(function (response) {
                res.status(200).send();
            }, function (err) {
                res.status(400).send();
            });
    }




    
};