플랫폼 선택 문서에 따라 어떤 플랫폼을 선택해야할지부터 알려줘봐.

웹사이트 형태는 단순해. 별다른 기능은 없고 브랜드 안의 여러 서비스로 가는 링크 버튼들이 있는게 다야.

링크 순서는 아래와 같아.
ypjr.leapsignal.net
jzahnny.leapsignal.net
https://eclipse.leapsignal.net/
focusroyale.leapsignal.net

각 링크는 나중에 수정이 용이하게 한 파일에 모두 모아둬.
각 링크는 카드로 존재하며 각 카드는 아래를 가지고 있어.
1. 1:1 비율의 thumbnail (image or video)
2. title
3. desc
4. link
5. card_id (str)
카드는 2가지 형태를 가지고 있어. 확장된 상태와 축소된 상태가 있어.

축소된 상태는 먼저 수평으로 div를 3개로 쪼개고
왼쪽: 썸네일
가운데: title과 그 아래 desc
오른쪽: 오른쪽 방향 화살표 icon

확장된 상태는
div를 위아래 2개오 쪼개고
위쪽: 썸네일
아래쪽: title과 그 아래 desc

또한 카드는 glow 중인지 아닌지도 있어.
glow 중이면 카드 자체 배경 색상을 좀 더 붉은색으로 바꾸고 gloe shadow를 적용해.

또한 웹 디자인은 blur를 사용할건데 어떻게 생겼는지 말해줄게
1. 반응형 디자인인데 pc, 태블릿 등에서 가로가 길어지면 카드를 모두 확장된 상태로 보여줘. 그리고 마우스 호버에 따라 glow를 바꿔줘.
2. 모바일에서는 모든 카드가 축소돼 있는데 화면 가운데에 있는 카드 하나만 확장시키고 glow가 나오게해줘. 또한 모바일에서는 접속시 맨 아래 카드부터 확장시키며 하나씩 가다가 이동해야하는 카드로 스크롤 가서 확장시키게 해줘. 특히 이 사이트 url은 leapsignal.net 인데 #인가? 파라미터를 url에서 전달하게 해서 각 card id로 바로 이동시키는 기능도 있게. pc도 마찬가지.
3. 카드는 이런데 배경은 어떻냐면 해당 썸네일 image or video를 맞을 때까지 크기를 키우고 여기에 blur를 적용하고 black opacity를 두게 해줘.

모든 css의 색상, blur, border, border radius 등 모든 것들은 통일해서 한 파일이 관할하게 해줘. 전체적인 분위기는 어둡지만 카드 등이 빛나면서 네온 분위기를 만드는 거야.

카드 상단 맨 위에는 <link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playwrite+IE:wght@100..400&display=swap" rel="stylesheet">

이 폰트로

Leap
Signal
Labs

수평 중앙 정렬

여기도 glow 효과 내주고 가장 강한 glow.


그리고 배경은 y에 따라 gradient를 적용하는데 마치 석양을 거꾸로 둔 것처럼 해줘. 아래쪽은 아주 붉고 위쪽은 맑고 청량한 푸른 하늘을 opacity 주고 overay. 즉, thumbnail < overay gradient < lightfall < 로고 < 카드

이 z index로

특히 https://reactbits.dev/backgrounds/lightfall 이거를 배경에 두고 싶은데 이건 내려오는 거란 말이야. 위로 올라가게 해줘.


그리고 최적화 입장에서 속도가 느리면 우선순위에 따라 아무것도 안 보일 수도 있잖아? 이 문제를 해결하려면 어떻게 해야할까?

지금은 doc/phase/00_starr/prompt.md
에 이걸 넣어뒀는데 이 웹사이트는 어떤 프레임워크, 어떤 배포 형식으로 해야 돈은 최소한으로 들면서 유지보수 할 게 없을지 그리고 어떻게 아키텍쳐를 짜고 만들건지 모든prd를 작성해봐. 그걸 보고 내가 허락하면 작업 시작하자.