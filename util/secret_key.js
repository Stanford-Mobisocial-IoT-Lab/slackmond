// -*- mode: js; indent-tabs-mode: nil; js-basic-offset: 4 -*-
//
// This file is part of ThingEngine
//
// Copyright 2015 The Board of Trustees of the Leland Stanford Junior University
//
// Author: Giovanni Campagna <gcampagn@cs.stanford.edu>
//
// See COPYING for details
"use strict";

const crypto = require('crypto');

const AES_BLOCK_SIZE = 16;
const CIPHER_NAME = 'id-aes128-GCM';

function getAESKey() {
    if (process.NODE_ENV !== 'production') {
        return new Buffer('80bb23f93126074ba01410c8a2278c0c', 'hex');
    } else {
        var key = process.env.AES_SECRET_KEY;
        if (key === undefined)
            throw new Error("Configuration error: AES key missing!");
        if (key.length !== 2*AES_BLOCK_SIZE) // AES-128
            throw new Error("Configuration error: invalid AES key length!");
        return new Buffer(key, 'hex');
    }
}

module.exports = {
    getSecretKey(app) {
        if (app.get('env') === 'development') {
            return 'not so secret key';
        } else {
            var key = process.env.SECRET_KEY;
            if (key === undefined)
                throw new Error("Configuration error: secret key missing!");
            return key;
        }
    },

    getJWTSigningKey() {
        if (process.NODE_ENV !== 'production') {
            return 'not so secret key';
        } else {
            var key = process.env.JWT_SIGNING_KEY;
            if (key === undefined)
                throw new Error("Configuration error: secret key missing!");
            return key;
        }
    },

    encrypt(data) {
        const iv = crypto.randomBytes(AES_BLOCK_SIZE);
        const cipher = crypto.createCipheriv(CIPHER_NAME, getAESKey(), iv);
        const buffers = [ cipher.update(data), cipher.final() ];
        return [
            iv.toString('base64'),
            Buffer.concat(buffers).toString('base64'),
            cipher.getAuthTag().toString('base64')
        ].join('$');
    },

    decrypt(data) {
        let [iv, ciphertext, authTag] = data.split('$');
        if (!iv || !ciphertext || !authTag)
            throw new Error('Invalid encrypted data (wrong format)');
        const decipher = crypto.createDecipheriv(CIPHER_NAME, getAESKey(), new Buffer(iv, 'base64'));
        decipher.setAuthTag(new Buffer(authTag, 'base64'));
        const buffers = [ decipher.update(new Buffer(ciphertext, 'base64')), decipher.final() ];
        return Buffer.concat(buffers);
    }
};
