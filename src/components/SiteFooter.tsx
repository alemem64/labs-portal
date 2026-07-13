import LangToggle from "./LangToggle";

const businessDetails = [
  ["대표", "신훈섭"],
  ["주소", "부산광역시 금정구 동현로 43번길 29 201호"],
  ["전화번호", "+82 1057168811"],
  ["이메일", "leapsignallabs@gmail.com"],
  ["사업자번호", "212-40-71972"],
  ["통신판매신고번호", "2026-부산금정-0121"],
] as const;

export default function SiteFooter() {
  return (
    <footer id="site-footer" className="site-footer">
      <address className="business-info">
        <dl>
          {businessDetails.map(([label, value]) => (
            <div className="business-info-row" key={label}>
              <dt>{label}</dt>
              <dd>
                {label === "전화번호" ? (
                  <a href="tel:+821057168811">{value}</a>
                ) : label === "이메일" ? (
                  <a href={`mailto:${value}`}>{value}</a>
                ) : (
                  value
                )}
              </dd>
            </div>
          ))}
        </dl>
      </address>
      <LangToggle />
    </footer>
  );
}
