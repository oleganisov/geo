import renderBalloon from '../templates/balloon.hbs';
/* global ymaps  */

let userData = {
    feedback: [
        { name: 'User1', comment: 'Test' },
        { name: 'User2', comment: 'Test2' }
    ]
};

function mapInit() {
    ymaps.ready(async () => {
        let placemarks = [];
        const map = await new ymaps.Map('map-container', {
            center: [55.1, 36.6],
            zoom: 12,
            controls: ['zoomControl'],
            behaviors: ['drag']
        });
        // Создание кластера.
        const clusterer = await new ymaps.Clusterer({
            clusterDisableClickZoom: true
        });

        // Создание метки.
        async function createPlacemark(coords, address = '', hintContent = '') {
            const newPlacemark = await new ymaps.Placemark(
                coords,
                { address, hintContent },
                {
                    iconLayout: 'default#image',
                    iconImageHref: '../assets/img/baloon_active.png',
                    iconImageSize: [44, 66],
                    iconImageOffset: [-22, -33],
                    balloonContentLayout: balloonContentLayout,
                    balloonCloseButton: false
                }
            );

            return newPlacemark;
        }
        // Получение адреса.
        async function getAddress(coords) {
            const geocode = await ymaps.geocode(coords);
            const firstObject = await geocode.geoObjects.get(0);
            const address = await firstObject.getAddressLine();

            return address;
        }
        // создание макета балуна
        const balloonContentLayout = ymaps.templateLayoutFactory.createClass(
            renderBalloon({
                balloonAddress: '$[properties.address]', //'{{ properties.address }}',
                // balloonList: userData.feedback
                balloonList: '$[properties.feedback]'
            }),
            {
                build() {
                    this.constructor.superclass.build.call(this);
                    const btnClose = document.querySelector('.feedback__close');
                    const btnSubmit = document.querySelector(
                        '.feedback__submit'
                    );

                    btnClose.addEventListener('click', this.handlerClose);
                    btnSubmit.addEventListener(
                        'click',
                        this.handlerSubmit.bind(this)
                    );
                },
                handlerClose() {
                    map.balloon.close();
                },
                handlerSubmit(e) {
                    e.preventDefault();
                    const feedback = {};
                    const arrFeedback = [];
                    const feedbackProp = {};
                    const form = document.querySelector('.feedback__form');

                    if (
                        form.name.value &&
                        form.place.value &&
                        form.comment.value
                    ) {
                        feedback.name = form.name.value;
                        feedback.place = form.place.value;
                        feedback.comment = form.comment.value;
                        feedback.date = new Date().toLocaleDateString('ru-RU');
                        arrFeedback.push(feedback);
                        feedbackProp.feedback = arrFeedback;
                        this.getData('geoObject').properties.set(feedbackProp);
                    } else {
                        // alert('Не заполнены поля');
                    }
                    if (this.getData('geoObject').properties) {
                        console.log(
                            this.getData('geoObject').properties.get('feedback')
                        );
                    }
                }
            }
        );

        map.events.add('click', async e => {
            const coords = await e.get('coords');
            const address = await getAddress(coords);
            const newPlacemark = await createPlacemark(
                coords,
                address,
                address
            );

            clusterer.add(newPlacemark);
            placemarks.push(newPlacemark);

            map.geoObjects.add(clusterer);

            if (!newPlacemark.balloon.isOpen()) {
                newPlacemark.balloon.open(
                    coords,
                    {},
                    {
                        balloonContentLayout: balloonContentLayout,
                        closeButton: false
                    }
                );
            }
        });
    });
}

export { mapInit };
