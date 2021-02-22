const LocalStrategy = require('passport-local').Strategy;
const pool = require("./db");
const bcrypt = require("bcrypt");

function initialize(passport) {
    const authenticateUser = (user_name, password, done) => {
        pool.query('SELECT * FROM account WHERE user_name=$1', [user_name],
            (err, results) => {
                if (err) {
                    throw err;
                }

                console.log(results.rows)

                if (results.rows.length > 0) {
                    const user = results.rows[0];

                    bcrypt.compare(password, user.password, (err, isMatch) => {
                        if (err) {
                            throw err;
                        }

                        if (isMatch) {
                            return done(null, user);
                        } else {
                            return done(null, false)
                        }
                    })
                } else {
                    return done(null, false);
                }
            }
        )

    }

    passport.use(
        new LocalStrategy({
            usernameField: "user_name",
            passwordField: "password"
        }, authenticateUser)
    )
    passport.serializeUser((user, done) => done(null, user.id));

    passport.deserializeUser((id, done) => {
        pool.query(
            'SELECT * FROM account WHERE id=$1', [id], (err, results) => {
                if (err) {
                    throw err
                }
                return done(null, results.rows[0]);
            })

    })
}

module.exports = initialize;
