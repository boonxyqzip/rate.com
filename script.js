class TierMaker {
    constructor() {
        this.items = [];
        this.itemIdCounter = 0;
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.setupEventListeners();
        this.renderItems();
    }

    setupEventListeners() {
        // 아이템 추가
        document.getElementById('addItemBtn').addEventListener('click', () => this.addItem());
        document.getElementById('itemName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addItem();
        });

        // 전체 초기화
        document.getElementById('clearAllBtn').addEventListener('click', () => this.clearAll());

        // 저장/불러오기
        document.getElementById('saveBtn').addEventListener('click', () => this.saveToStorage());
        document.getElementById('loadBtn').addEventListener('click', () => this.loadFromStorage());

        // 드래그 앤 드롭 이벤트
        this.setupDragAndDrop();
    }

    addItem() {
        const nameInput = document.getElementById('itemName');
        const imageInput = document.getElementById('itemImage');
        const name = nameInput.value.trim();
        const file = imageInput.files[0];

        if (!name) {
            alert('아이템 이름을 입력해주세요!');
            return;
        }

        const item = {
            id: this.itemIdCounter++,
            name: name,
            image: null,
            tier: null
        };

        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                item.image = e.target.result;
                this.items.push(item);
                this.renderItems();
                this.saveToStorage();
            };
            reader.readAsDataURL(file);
        } else {
            this.items.push(item);
            this.renderItems();
            this.saveToStorage();
        }

        nameInput.value = '';
        imageInput.value = '';
    }

    deleteItem(itemId) {
        if (confirm('이 아이템을 삭제하시겠습니까?')) {
            this.items = this.items.filter(item => item.id !== itemId);
            this.renderItems();
            this.saveToStorage();
        }
    }

    clearAll() {
        if (confirm('모든 아이템을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
            this.items = [];
            this.itemIdCounter = 0;
            this.renderItems();
            this.saveToStorage();
        }
    }

    setupDragAndDrop() {
        let draggedItemId = null;

        // 이벤트 위임을 사용하여 동적으로 생성되는 요소에도 작동하도록 함
        document.addEventListener('dragstart', (e) => {
            const item = e.target.closest('.item');
            if (item && item.draggable) {
                draggedItemId = parseInt(item.dataset.itemId);
                item.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', draggedItemId.toString());
                
                // 이미지나 버튼에서 드래그가 시작되는 경우 방지
                if (e.target.tagName === 'IMG' || e.target.tagName === 'BUTTON') {
                    e.preventDefault();
                    return false;
                }
            }
        });

        document.addEventListener('dragend', (e) => {
            const item = e.target.closest('.item');
            if (item) {
                item.classList.remove('dragging');
            }
            draggedItemId = null;
            document.querySelectorAll('.drag-over').forEach(el => {
                el.classList.remove('drag-over');
            });
        });

        // 드롭 영역에 대한 이벤트 (이벤트 위임 사용)
        document.addEventListener('dragover', (e) => {
            const dropZone = e.target.closest('.tier-items, .unranked-items');
            if (dropZone) {
                e.preventDefault();
                e.stopPropagation();
                e.dataTransfer.dropEffect = 'move';
                dropZone.classList.add('drag-over');
            }
        });

        document.addEventListener('dragenter', (e) => {
            const dropZone = e.target.closest('.tier-items, .unranked-items');
            if (dropZone) {
                e.preventDefault();
                dropZone.classList.add('drag-over');
            }
        });

        document.addEventListener('dragleave', (e) => {
            const dropZone = e.target.closest('.tier-items, .unranked-items');
            if (dropZone) {
                // 실제로 영역을 벗어났는지 확인
                const rect = dropZone.getBoundingClientRect();
                const x = e.clientX;
                const y = e.clientY;
                
                if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
                    dropZone.classList.remove('drag-over');
                }
            }
        });

        document.addEventListener('drop', (e) => {
            const dropZone = e.target.closest('.tier-items, .unranked-items');
            if (dropZone) {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.remove('drag-over');

                const itemId = parseInt(e.dataTransfer.getData('text/plain'));
                if (!isNaN(itemId) && itemId !== null) {
                    const newTier = dropZone.dataset.tier || null;
                    const item = this.items.find(i => i.id === itemId);
                    
                    if (item) {
                        item.tier = newTier;
                        this.renderItems();
                        this.saveToStorage();
                    }
                }
            }
        });
    }

    renderItems() {
        // 모든 티어와 미분류 영역 초기화
        document.querySelectorAll('.tier-items').forEach(container => {
            container.innerHTML = '';
        });
        document.getElementById('unrankedItems').innerHTML = '';

        // 아이템 렌더링
        this.items.forEach(item => {
            const itemElement = this.createItemElement(item);
            
            if (item.tier) {
                const tierContainer = document.querySelector(`.tier-items[data-tier="${item.tier}"]`);
                if (tierContainer) {
                    tierContainer.appendChild(itemElement);
                }
            } else {
                document.getElementById('unrankedItems').appendChild(itemElement);
            }
        });
    }

    createItemElement(item) {
        const div = document.createElement('div');
        div.className = 'item';
        div.draggable = true;
        div.dataset.itemId = item.id;

        if (item.image) {
            const img = document.createElement('img');
            img.src = item.image;
            img.alt = item.name;
            img.draggable = false; // 이미지 드래그 방지
            div.appendChild(img);
        }

        const nameSpan = document.createElement('span');
        nameSpan.className = 'item-name';
        nameSpan.textContent = item.name;
        nameSpan.draggable = false; // 텍스트 드래그 방지
        div.appendChild(nameSpan);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '×';
        deleteBtn.draggable = false; // 버튼 드래그 방지
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.deleteItem(item.id);
        };
        div.appendChild(deleteBtn);

        return div;
    }

    saveToStorage() {
        const data = {
            items: this.items,
            itemIdCounter: this.itemIdCounter
        };
        localStorage.setItem('tierMakerData', JSON.stringify(data));
        alert('저장되었습니다!');
    }

    loadFromStorage() {
        const saved = localStorage.getItem('tierMakerData');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.items = data.items || [];
                this.itemIdCounter = data.itemIdCounter || 0;
                this.renderItems();
            } catch (e) {
                console.error('저장된 데이터를 불러오는 중 오류가 발생했습니다:', e);
            }
        }
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    new TierMaker();
});

