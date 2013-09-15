var wireless = require('wireless'),
    fs = require('fs'),
    _ = require('underscore'),
    colors = require('colors'),
    Bancroft = require('bancroft'),
    gps = new Bancroft(),
    util = require('util'),
    sys = require('sys'),
    exec = require('child_process').exec;

function puts(error, stdout, stderr) {
}
exec("sudo gpsd -n -D 2 /dev/ttyUSB0", puts);

var latlng, ifNull, nCounter = 0;

wireless.configure({
    iface: 'wlan0',
    updateFrequency: 12,
    vanishThreshold: 7,
});

wireless.enable(function() {
    console.log(("[PROGRESS] Wireless card enabled.").cyan);
    console.log(("[PROGRESS] Starting wireless scan...").cyan);

    wireless.start(function() {
        console.log(("[PROGRESS] Wireless scanning has commenced.").cyan);
    });
});

gps.on('connect', function() {
    util.log('connected to gps module');
    // reboot gps
});
gps.on('location', function(location) {
    ifNull = location.geometries.coordinates[0];
    latlng = location.geometries.coordinates;
});
// Found a new network
wireless.on('appear', function(error, network) {
    if (error) {
        console.log("[   ERROR] There was an error when a network appeared");
        throw error;
    }
    var quality = Math.floor(network.quality / 70 * 100);
    var ssid = network.ssid || '<HIDDEN>';
    var encryption_type = 'NONE';
    if (network.encryption_wep) {
        encryption_type = 'WEP';
    } else if (network.encryption_wpa && network.encryption_wpa2) {
        encryption_type = 'WPA&WPA2';
    } else if (network.encryption_wpa) {
        encryption_type = 'WPA';
    } else if (network.encryption_wpa2) {
        encryption_type = 'WPA2';
    }
    // if(ifNull !== undefined) {
        nCounter++;
        fs.writeFile('nCounter.txt', nCounter, function(err) {
            if(err) throw err;
            console.log('number saved: ' + nCounter);
        });
        var write = ssid + ',"{""type"":""Point"",""coordinates"":[' + latlng[0] + ',' + latlng[1] + '[}"\n';
        fs.appendFile('data.csv', write, function(err) {
            if(err) throw err;
            console.log('data saved: ' + write);
        });
    // }

});

// Just for debugging purposes
wireless.on('debug', function(error, command) {
    console.log(("[ COMMAND] " + command).grey);
});

wireless.on('dhcp-acquired-ip', function(error, ip_address) {
    console.log(("[    DHCP] Leased IP " + ip_address).grey);
});

wireless.on('empty-scan', function(error) {
    console.log(("[   EMPTY] Found no networks this scan").yellow);
});

wireless.on('warning', function(error, message) {
    console.log(("[ WARNING] " + message).yellow);
});

wireless.on('error', function(error, message) {
    console.log(("[   ERROR] " + message).red);
});

wireless.on('fatal', function(error, message) {
    console.log(("[   FATAL] " + message).red.underline);
});