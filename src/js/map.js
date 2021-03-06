import renderBalloon from '../templates/balloon.hbs';
/* global ymaps  */
const placemarks = localStorage.placemarks
    ? JSON.parse(localStorage.placemarks)
    : [];

function mapInit() {
    ymaps.ready(async () => {
        const map = await new ymaps.Map('map-container', {
            center: [55.1, 36.6],
            zoom: 15,
            controls: ['zoomControl'],
            behaviors: ['drag']
        });
        // создание макета балуна кластера
        const clusterBalloonItemContentLayout = ymaps.templateLayoutFactory.createClass(
            '<div class=carousel>' +
                '<div class="carousel__address"><a href=# class="carousel__link">{{properties.address}}</a></div>' +
                '{% if properties.feedback.length %}' +
                '{% for feed in properties.feedback %}' +
                '<div class="carousel__place">{{feed.place}} </div>' +
                '<div class="carousel__comment">{{feed.comment}}</div>' +
                '<div class="carousel__date">{{feed.date}}</div>' +
                '{% endfor %}' +
                '{% else %}' +
                '<div class="carousel__empty"> Отзывов пока нет... </div>' +
                '{% endif %} </div>',
            {
                build() {
                    this.constructor.superclass.build.call(this);
                    const linkOpen = document.querySelector('.carousel__link');

                    linkOpen.addEventListener(
                        'click',
                        this.handlerBallonOpen.bind(this)
                    );
                },
                handlerBallonOpen(e) {
                    e.preventDefault();
                    const coords = this.getData().geoObject.geometry
                        ._coordinates;
                    const geoObject = this.getData().geoObject;

                    // закрытие балуна кластера
                    // this.events.fire('userclose');
                    map.zoomRange.get(coords).then(range => {
                        map.setCenter(coords, range[1], {
                            checkZoomRange: true // контролируем доступность масштаба
                        }).then(() => {
                            // спозиционировались
                            geoObject.balloon.open();
                        });
                    });
                }
            }
        );
        // создание макета балуна метки
        const balloonContentLayout = ymaps.templateLayoutFactory.createClass(
            renderBalloon({
                balloonAddress: '{{properties.address}}',
                balloonList:
                    '{% if properties.feedback.length %}' +
                    '{% for feed in properties.feedback %}' +
                    '<div class="feedback__item"><div>' +
                    '<span class="feedback__author">{{feed.name}} </span>' +
                    '<span class="feedback__place">{{feed.place}} </span>' +
                    '<span class="feedback__date">{{feed.date}}</span></div>' +
                    '<div class="feedback__comment">{{feed.comment}}</div></div>' +
                    '{% endfor %}' +
                    '{% else %}' +
                    '<div class="feedback__empty"> Отзывов пока нет... </div>' +
                    '{% endif %}'
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
                    const coords = this.getData().geometry._coordinates;
                    // поиск индекса элемента массива по текущиим координатам
                    const posElem = placemarks.findIndex(
                        item => item.id == coords.join('')
                    );
                    let placemark = {};
                    const feedback = {};
                    const arrFeedback = this.getData(
                        'geoObject'
                    ).properties.get('feedback')
                        ? this.getData('geoObject').properties.get('feedback')
                        : [];
                    const form = document.querySelector('.feedback__form');

                    if (
                        form.name.value &&
                        form.place.value &&
                        form.comment.value
                    ) {
                        feedback.name = form.name.value;
                        feedback.place = form.place.value;
                        feedback.comment = form.comment.value;
                        feedback.date = new Date().toLocaleString('ru-RU');
                        arrFeedback.push(feedback);
                        this.getData('geoObject').properties.set(
                            'feedback',
                            arrFeedback
                        );

                        placemark = {
                            id: coords.join(''),
                            coords,
                            feedback: arrFeedback
                        };
                        // замена элемента в массиве меток
                        placemarks.splice(posElem, 1, placemark);
                        localStorage.placemarks = JSON.stringify(placemarks);
                    } else {
                        alert('Не заполнены поля');
                    }
                }
            }
        );
        // Создание кластера.
        const clusterer = await new ymaps.Clusterer({
            clusterDisableClickZoom: true,
            clusterOpenBalloonOnClick: true,
            clusterBalloonContentLayout: 'cluster#balloonCarousel',
            clusterBalloonItemContentLayout: clusterBalloonItemContentLayout,
            clusterBalloonCycling: false,
            clusterBalloonPagerType: 'marker',
            hideIconOnBalloonOpen: false,
            clusterIcons: [
                {
                    href: '../assets/img/baloon_notactive.png',
                    size: [44, 66],
                    offset: [-22, -33]
                }
            ],
            clusterNumbers: [100]
        });

        // Создание метки.
        async function createPlacemark(
            coords,
            address = '',
            hintContent = '',
            feedback = ''
        ) {
            const newPlacemark = await new ymaps.Placemark(
                coords,
                {
                    address,
                    hintContent,
                    feedback
                },
                {
                    iconLayout: 'default#image',
                    iconImageHref: '../assets/img/baloon_active.png',
                    iconImageSize: [44, 66],
                    iconImageOffset: [-22, -33],
                    balloonContentLayout: balloonContentLayout,
                    balloonMaxHeight: 500,
                    balloonCloseButton: false,
                    hideIconOnBalloonOpen: false
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
        placemarks.forEach(async obj => {
            const objAddr = await getAddress(obj.coords);
            const mark = await createPlacemark(
                obj.coords,
                objAddr,
                objAddr,
                obj.feedback
            );

            clusterer.add(mark);
        });

        // обработчик кликов на карте
        map.events.add('click', async e => {
            const coords = await e.get('coords');
            let placemark = {};
            const address = await getAddress(coords);
            const newPlacemark = await createPlacemark(
                coords,
                address,
                address
            );

            clusterer.add(newPlacemark);
            // сохранение метки в массив из объектов и в localStorage
            placemark = { id: coords.join(''), coords };
            placemarks.push(placemark);
            localStorage.placemarks = JSON.stringify(placemarks);

            // открытие балуна новой метки
            if (!newPlacemark.balloon.isOpen()) {
                newPlacemark.balloon.open(coords);
            }
        });
        map.geoObjects.add(clusterer);
    });
}

export { mapInit };
