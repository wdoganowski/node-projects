var test = 'test';

switch (test) {
	case 'not': console.log('not'); break;
	case 'test': console.log('test'); break;
	default: console.log('default');
}

var events = [{'one':1}, {'two':2}];

//events.push({'one',1});
//events.push({'two',2});

console.log(events['one']);
console.log(events['three']);
console.log(events[0]);
