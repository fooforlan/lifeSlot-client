require('./utils');
const noUiSlider = require('./nouislider.min');
const BigNumber = require('./bignumber.min');
const abi = require('./conf.js');
const transformProp = 'transform';

function Spinner3D(el) {
    this.element = el;
    this.rotation = 0;
    this.panelCount = 0;
    this.totalPanelCount = this.element.children.length;
    this.theta = 0;
    this.isHorizontal = false;
}

Spinner3D.prototype.modify = function () {

    let panel, angle, i;
    this.panelSize = this.element[this.isHorizontal ? 'offsetWidth' : 'offsetHeight'];
    this.rotateFn = this.isHorizontal ? 'rotateY' : 'rotateX';
    this.theta = 360 / this.panelCount;
    this.radius = Math.round((this.panelSize / 2) / Math.tan(Math.PI / this.panelCount));

    for (i = 0; i < this.panelCount; i++) {
        panel = this.element.children[i];
        angle = this.theta * i;
        panel.style.opacity = 1;
        panel.style.backgroundColor = 'hsla(' + angle + ', 100%, 100%, .85)';
        panel.style[transformProp] = this.rotateFn + '(' + angle + 'deg) translateZ(' + this.radius + 'px)';
    }

    for (; i < this.totalPanelCount; i++) {
        panel = this.element.children[i];
        panel.style.opacity = 0;
        panel.style[transformProp] = 'none';
    }
    this.rotation = Math.round(this.rotation / this.theta) * this.theta;
    this.transform();
};

Spinner3D.prototype.transform = function () {
    this.element.style[transformProp] = 'translateZ(-' + this.radius + 'px) ' + this.rotateFn + '(' + this.rotation + 'deg)';
};

var buildSpinners = function () {

    var spinnerList = document.getElementsByClassName('carousel-item');

    for (let spinner = 0; spinner < spinnerList.length; spinner++) {
        spinnerList[spinner].carousel = new Spinner3D(spinnerList[spinner]),
            onNavButtonClick = function (event) {
                var increment = parseInt(event.target.getAttribute('data-increment'));
                spinnerList[spinner].carousel.rotation += spinnerList[spinner].carousel.theta * increment * -1;
                spinnerList[spinner].carousel.transform();
            };

        spinnerList[spinner].carousel.panelCount = 11;
        spinnerList[spinner].carousel.modify();
    }
};

var parseResult = function (result) {
    let resultArray = ('' + result).split('');
    if (resultArray.length === 3) {
        return resultArray;
    }
    if (resultArray.length === 2) {
        resultArray.unshift(0);
        return resultArray;
    }
    if (resultArray.length === 1) {
        resultArray.unshift(0);
        resultArray.unshift(0);
        return resultArray;
    }
};

var resetSpinner = function () {
    setStandByOff();
    for (let spinner in spinnerList) {
        if (spinner === 'length') {
            return;
        }
        spinnerList[spinner].carousel.rotation = 0;
        spinnerList[spinner].carousel.transform();
    }
};

var getRandomArbitrary = function (min, max) {
    return Math.random() * (max - min) + min;
};

var spin = function (key, spinner) {
    setStandByOff();
    spinnerList[key].carousel.rotation = 0;
    spinnerList[key].carousel.transform();
    if (spinner === 0) return;
    let spin = parseInt(spinner) + 12;
    let time = getRandomArbitrary(100, 800);

    setTimeout(function () {
        spinnerList[key].carousel.rotation += spinnerList[key].carousel.theta * spin * -1;
        spinnerList[key].carousel.transform();
    }, time);

    setTimeout(function () {
        var spinners = document.getElementsByClassName('spinners');
        spinners[0].removeClassName('spinning-play');
    }, 2000);

};

var setStandByPlayOn = function () {
    var spinners = document.getElementsByClassName('spinners');
    spinners[0].addClassName('spinning-play');
    spinners[0].removeClassName('spinning');
};


var setStandByOn = function () {
    var spinners = document.getElementsByClassName('spinners');
    spinners[0].addClassName('spinning');
};

var setStandByOff = function () {
    var spinners = document.getElementsByClassName('spinners');
    spinners[0].removeClassName('spinning');
};

var spinFromPlay = function (result) {
    let parsedResult = parseResult(result);

    for (let spinner in spinnerList) {
        if (spinner === 'length') {
            return;
        }
        spin(spinner, parsedResult[spinner]);

    }
};

const initSpinner = function () {

    buildSpinners();

    setTimeout(function () {
        setStandByOn();
    }, 1600);

    setTimeout(function () {
        document.body.addClassName('ready');
    }, 0);

};

const bootstrap = function () {

    if (typeof window.web3 !== 'undefined') {
        var web3 = new Web3(window.web3.currentProvider);
    } else {
        // set the provider you want from Web3.providers, for local dev
        var web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545"));
    }

    if (!web3.eth.accounts[0]) {
        var interval = setInterval(function () {
            if (web3.eth.accounts[0]) {
                clearInterval(interval);
                document.getElementById('error').innerText = '';
                var interval = setInterval(function () {
                    web3.eth.getBalance(web3.eth.accounts[0], function (e, r) {
                        document.getElementById('account').innerText = parseFloat(web3.fromWei(r, 'ether')).toFixed(5) + ' ETH';
                    });
                }, 2000);
            }
            else {
                document.getElementById('error').innerText = 'Unlock metamask account';
            }
        }, 5000);
    }

    var data = function (address, contract) {
        return {
            contract: contract,
            address: address,
            owner: null,
            create_block: 0,
            balance: 0,
            max_fee: 0,
            last_result: null
        };
    };

    var init = function (address, contract) {
        var proxy = new Proxy(data(address, contract), {
            set: function (obj, prop, value) {
                obj[prop] = value;
                switch (prop) {
                    case 'balance':
                    case 'max_fee':
                        document.getElementById(prop).innerText = parseFloat(web3.fromWei(value, 'ether')).toFixed(5) + ' ETH';
                        break;

                    case 'last_result':
                        var _value = parseInt(value);
                        document.getElementById(prop).innerText = _value;
                        break;

                    case 'address':
                    case 'owner':
                        var a = document.createElement('a');
                        a.setAttribute('href', 'https://ropsten.etherscan.io/address/' + value);
                        a.setAttribute('target', '_blank');
                        a.innerText = value;
                        document.getElementById(prop).removeChild(document.getElementById(prop).firstChild);
                        document.getElementById(prop).append(a);
                        break;
                }
                return true;
            }
        });
        var all_events = proxy.contract.allEvents({fromBlock: 'latest'}, function (e, r) {

            switch (r.event) {
                case 'Play':
                    render_play(r);
                    proxy.last_result = parseInt(r.args._result);

                    if (r.args._sender == web3.eth.accounts[0]) {
                        spinFromPlay(proxy.last_result);
                    }

                    break;

                case 'Balance':
                    proxy.balance = r.args._balance;
                    proxy.contract.max_fee(function (e, r) {
                        proxy.max_fee = r;
                        max_fee = parseInt(parseInt(r / step) * step);
                        document.getElementById('fee-slider').noUiSlider.updateOptions({
                            range: {
                                min: step,
                                max: max_fee
                            }
                        });
                    });
                    break;

                case 'Destroy':
                    all_events.stopWatching();
                    break;
            }
        });
        render(proxy);
        collect_data(proxy);
    };

    var collect_old_events = function (data) {
        web3.eth.getBlockNumber(function (e, r) {
            var to_block = r;
            data.contract.Play({_sender: [web3.eth.accounts[0]]}, {
                fromBlock: data.create_block,
                toBlock: to_block
            }, function (e, r) {
                if (e) {
                    console.log(e);
                    return;
                }
                render_play(r);
            });
        });
    };

    var collect_data = function (data) {
        var contract = data.contract;
        web3.eth.getBalance(data.address, function (e, r) {
            data.balance = r;
        });
        contract.owner(function (e, r) {
            data.owner = r;
        });
        contract.max_fee(function (e, r) {
            data.max_fee = r;
            create_sliders(r);
        });
        contract.create_block(function (e, r) {
            data.create_block = r;
            setTimeout(function () {
                collect_old_events(data);
            }, 2000);
        });
        contract.last_result(function (e, r) {
            data.last_result = r;
        });
        data.address = data.address;
    };

    var time_now = function () {
        var d = new Date();
        var now = Math.floor(d.getTime() / 1000);
        return now;
    };

    var time_ago = function (timestamp) {
        var seconds = time_now() - timestamp;
        if (seconds > 2 * 86400) {
            return Math.floor(seconds / 86400) + ' days ago';
        }
        if (seconds > 86400) {
            return 'yesterday';
        }
        if (seconds > 3600) {
            return Math.floor(seconds / 3600) + ' hours ago';
        }
        if (seconds > 60) {
            return Math.floor(seconds / 60) + ' min ago';
        }
        return 'a few sec ago';
    }

    var update_time_ago = function () {
        var times = document.getElementsByTagName('time');
        for (var i = 0; i < times.length; i++) {
            times[i].innerText = time_ago(times[i].dataset.timestamp);
        }
    };

    var wait_play = function (tx) {
        id = tx;
        var el = document.getElementById(id);
        if (!el) {
            var article = document.getElementById('play');
            var div = document.createElement('div');
            div.id = id;
            div.className = 'line pending';

            var time = document.createElement('time');
            time.dataset.timestamp = time_now();
            var text = document.createTextNode('NOW');
            time.appendChild(text);
            div.appendChild(time);

            var text = document.createTextNode('Tx pending, wating for sonerex');
            div.appendChild(text);
            article.prepend(div);
        }
    };

    var render_play = function (play_event) {
        id = play_event.transactionHash;
        var el = document.getElementById(id);
        if (el) {
            el.parentNode.removeChild(el);
        }
        var article = document.getElementById('play');
        var div = document.createElement('div');
        div.id = id;
        div.className = 'line';

        var time = document.createElement('time');
        time.dataset.timestamp = play_event.args._time;
        var text = document.createTextNode(time_ago(play_event.args._time));
        time.appendChild(text);
        div.appendChild(time);

        if (play_event.args._winner) {
            div.className = 'line winner';
        }
        var text = document.createTextNode('start: ' + parseInt(play_event.args._start) + ' end: ' + parseInt(play_event.args._end) + ' result: ' + parseInt(play_event.args._result));
        div.appendChild(text);
        article.prepend(div);
    };

    var render = function (data) {
        var section = document.getElementById('section');
        var article = document.createElement('article');
        article.id = data.address;
        for (var key in data) {
            if (['contract', 'create_block'].indexOf(key) != -1) {
                continue;
            }
            var span = document.createElement('span');
            span.id = key;
            var text = document.createTextNode(data[key]);
            span.appendChild(text);
            var div = document.createElement('div');
            div.className = 'line';
            var text = document.createTextNode(key.replace('_', ' ') + ': ');
            div.appendChild(text);
            div.appendChild(span);
            article.appendChild(div);
        }
        var div = document.createElement('div');
        div.className = 'line';
        div.id = 'play-error';
        div.style = 'color: #f00;';
        var text = document.createTextNode('');
        div.appendChild(text);
        article.appendChild(div);

        var div = document.createElement('div');
        div.className = 'line';

        var h5 = document.createElement('h5');
        var text = document.createTextNode('Risk range from START to END, guess the RESULT between 1 and 255');
        h5.appendChild(text);
        div.appendChild(h5);

        var guess_slider = document.createElement('div');
        guess_slider.id = 'guess-slider';
        div.appendChild(guess_slider);

        var h5 = document.createElement('h5');
        var text = document.createTextNode('Participation fee to send in ETH (this controls the prize)');
        h5.appendChild(text);
        div.appendChild(h5);

        var fee_slider = document.createElement('div');
        fee_slider.id = 'fee-slider';
        div.appendChild(fee_slider);

        var input = document.createElement('input');
        input.id = 'submit';
        input.type = 'button';
        input.value = 'PLAY'
        input.addEventListener('click', function () {
            play(data);
        });
        div.appendChild(input);

        article.appendChild(div);

        var h3 = document.createElement('h3');
        var text = document.createTextNode('Play history');
        h3.appendChild(text);
        article.appendChild(h3);

        var div = document.createElement('div');
        div.className = 'line';
        div.id = 'play';
        article.appendChild(div);

        section.appendChild(article);

        setInterval(function () {
            update_time_ago();
        }, 60000);
    };

    var create_sliders = function (max_fee) {
        var guess_slider = document.getElementById('guess-slider');
        noUiSlider.create(guess_slider, {
            start: [30, 225],
            step: 1,
            behaviour: 'drag',
            connect: [true, true, true],
            tooltips: true,
            range: {
                'min': 1,
                'max': 255
            },
            pips: {
                mode: 'values',
                values: [1, 255],
                density: 1
            },
            format: {
                to: function (value) {
                    return parseInt(value);
                },
                from: function (value) {
                    return parseInt(value);
                }
            }
        });
        var connect = guess_slider.querySelectorAll('.noUi-connect');
        connect[0].classList.add('red');
        connect[1].classList.add('blue');
        connect[2].classList.add('red');
        guess_slider.noUiSlider.on('set', function () {
            calculate_prize();
        });


        max_fee = parseInt(parseInt(max_fee / step) * step);
        var fee_slider = document.getElementById('fee-slider');
        noUiSlider.create(fee_slider, {
            start: 0.1,
            step: step,
            connect: [true, false],
            tooltips: true,
            range: {
                'min': step,
                'max': max_fee
            },
            format: {
                to: function (value) {
                    return parseFloat(web3.fromWei(value, 'ether')).toFixed(3) + ' ETH';
                },
                from: function (value) {
                    return web3.toWei(value.replace(' ETH', ''), 'ether');
                }
            }
        });
        var connect = fee_slider.querySelectorAll('.noUi-connect');
        connect[0].classList.add('green');
        fee_slider.noUiSlider.on('set', function () {
            calculate_prize();
        });
        calculate_prize();
    };

    var calculate_prize = function () {
        var guess_slider = document.getElementById('guess-slider').noUiSlider.get()
        var start = guess_slider[0];
        var end = guess_slider[1];
        var fee = web3.toWei(document.getElementById('fee-slider').noUiSlider.get().replace(' ETH', ''), 'ether');
        fee = new BigNumber(fee);

        // from .sol
        var range = end - start + 1;
        var percentage = 100 - parseInt(range * 100 / 255);
        var prize = fee.times(percentage).div(100);
        var credit = fee.plus(prize);

        fee = parseFloat(web3.fromWei(fee, 'ether')).toFixed(3) + ' ETH';
        credit = parseFloat(web3.fromWei(credit, 'ether')).toFixed(3) + ' ETH';

        document.getElementById('submit').value = 'PLAY ' + fee + ' and WIN ' + credit;
    };

    var play = function (data) {
        if (!web3.eth.accounts[0]) {
            document.getElementById('play-error').innerText = 'Unlock metamask account';
            return;
        }
        document.getElementById('play-error').innerText = '';
        var guess_slider = document.getElementById('guess-slider').noUiSlider.get()
        var start = ('0' + guess_slider[0].toString(16)).slice(-2);
        var end = ('0' + guess_slider[1].toString(16)).slice(-2);
        var fee = web3.toWei(document.getElementById('fee-slider').noUiSlider.get().replace(' ETH', ''), 'ether');
        if (start.length == 2 && start.match(/[0-9a-f]{2}/) &&
            end.length == 2 && end.match(/[0-9a-f]{2}/) &&
            fee.length > 0 && fee.match(/[0-9]+/)) {
            start = "0x" + start;
            end = "0x" + end;
            fee = new BigNumber(fee);
            data.contract.play(start, end, {from: web3.eth.accounts[0], value: fee}, function (e, r) {
                if (e) {
                    document.getElementById('play-error').innerText = 'Transaction was NOT completed, try again.';
                    console.log(e.message);
                }
                if (r) {
                    wait_play(r);
                    console.log('play tx ' + r);
                    setStandByPlayOn();

                }
            });
        }
        else {
            document.getElementById('play-error').innerText = 'enter start and end bytes';
        }
    };

    var address = '0x995f617066a6968749eb980c2613314f4d45d4ab';
    var contract = web3.eth.contract(abi);
    var ETHBlockByte = contract.at(address);
    var step = 1000000000000000; // 0.001 ETH

    init(address, ETHBlockByte);

    return {play: play};
};

window.addEventListener('DOMContentLoaded', function () {
    bootstrap();
    initSpinner();
}, false);
