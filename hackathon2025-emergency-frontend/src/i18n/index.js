import { useCallback, useEffect, useState } from "react";

const LANG_STORAGE_KEY = "iflow_lang";

const translations = {
  vi: {
    "common.login": "Đăng nhập",
    "common.register": "Đăng ký",
    "common.logout": "Đăng xuất",
    "common.language": "Ngôn ngữ",
    "common.english": "Tiếng Anh",
    "common.vietnamese": "Tiếng Việt",
    "common.cancel": "Hủy",
    "common.processing": "Đang xử lý...",
    "common.ivePaid": "Tôi đã thanh toán",
    "common.upload": "Tải lên",
    "common.search": "Tìm kiếm",
    "common.searchPlaceholder": "Tìm kiếm hóa đơn, SME, nhà đầu tư",
    "common.export": "Xuất",
    "common.support": "Hỗ trợ",
    "common.review": "Xem xét",
    "common.fundNow": "Tài trợ ngay",
    "common.onTrack": "Đúng tiến độ",
    "common.update": "Cập nhật",
    "common.deposit": "Nạp",
    "common.withdraw": "Rút",
    "common.amount": "Số tiền",
    "common.password": "Mật khẩu",
    "common.general": "Chung",
    "common.invoice": "Hóa đơn",
    "common.monthsShort": "{count} tháng",
    "common.termMonths": "Kỳ hạn (tháng)",
    "common.aprPercent": "Lãi suất APR %",
    "common.nextPayout": "Kỳ trả tiếp theo",
    "common.close": "Đóng",
    "common.owner": "Chủ sở hữu",
    "common.actionFailed": "Thao tác thất bại",
    "common.amountGreaterThanZero": "Số tiền phải lớn hơn 0.",

    "role.admin": "Quản trị",
    "role.investor": "Nhà đầu tư",
    "role.sme": "SME",

    "time.hours": "{count} giờ",
    "time.days": "{count} ngày",
    "time.minutes": "{count} phút",

    "logo.tagline": "Cầu nối SME & nhà đầu tư",

    "sidebar.live": "Mạng trực tiếp",
    "sidebar.needHelp": "Cần hỗ trợ?",
    "sidebar.needHelpDesc":
      "Liên hệ đội tuân thủ để onboarding hoặc đánh giá rủi ro.",

    "qr.title": "Quét để thanh toán",
    "qr.helper":
      "Quét mã QR bằng ví của bạn. Nhấn nút xác nhận sau khi thanh toán.",

    "home.nav.howItWorks": "Cách hoạt động",
    "home.nav.forInvestors": "Dành cho nhà đầu tư",
    "home.nav.forSmes": "Dành cho SME",
    "home.nav.impact": "Tác động",
    "home.nav.getStarted": "Bắt đầu",
    "home.hero.badge": "Sàn vốn dựa trên hóa đơn",
    "home.hero.title":
      "Kết nối hóa đơn SME khẩn cấp với nhà đầu tư tìm kiếm lợi suất cao.",
    "home.hero.description":
      "InvoiceFlow là cầu nối giữa SME và nhà đầu tư. SME mở khóa vốn lưu động nhanh, còn nhà đầu tư nhận lợi suất minh bạch, cao hơn ngân hàng với thang rủi ro rõ ràng.",
    "home.hero.startInvesting": "Bắt đầu đầu tư",
    "home.hero.applySme": "Đăng ký SME",
    "home.hero.verifiedInvoices": "Hóa đơn đã xác thực",
    "home.hero.riskTieredReturns": "Lợi suất theo mức rủi ro",
    "home.pipeline.title": "Tiến độ huy động",
    "home.pipeline.live": "Trực tiếp",
    "home.pipeline.snapshotNote":
      "Thời gian gọi vốn TB: {avg}. Vốn nhà đầu tư chờ: {demand}.",
    "home.pipeline.impactScore": "Điểm tác động",
    "home.pipeline.impactNote": "SME được hỗ trợ trong toàn mạng lưới.",
    "home.stats.capitalDeployed": "Vốn đã giải ngân",
    "home.stats.invoicesListed": "{count} hóa đơn đang niêm yết",
    "home.stats.activeSmes": "SME đang hoạt động",
    "home.stats.verifiedIssuers": "Đơn vị phát hành đã xác minh",
    "home.stats.netYield": "Lợi suất ròng nhà đầu tư",
    "home.stats.avgAnnualized": "Bình quân năm",
    "home.pipeline.fundedPercent": "Đã huy động {percent}%",
    "home.pipeline.escrowReady": "Sẵn sàng ký quỹ",
    "home.pipeline.emergencyLane": "Luồng khẩn cấp",
    "home.snapshot.avgFundingTime": "Thời gian gọi vốn TB",
    "home.snapshot.avgFundingNote": "Từ niêm yết đến giải ngân",
    "home.snapshot.topSectorDemand": "Ngành được quan tâm",
    "home.snapshot.topSectorNote": "Dựa trên thẻ hóa đơn",
    "home.snapshot.investorDemand": "Nhu cầu nhà đầu tư",
    "home.snapshot.investorDemandNote": "Vốn chờ so với nhu cầu",
    "home.sections.whyEyebrow": "Vì sao InvoiceFlow",
    "home.sections.whyTitle":
      "Thiết kế cho niềm tin, tốc độ, và lợi suất minh bạch.",
    "home.sections.whyDescription":
      "Chúng tôi kết hợp chuẩn fintech với tốc độ ưu tiên SME. Nhà đầu tư thấy thang rủi ro rõ ràng, SME nhận vốn nhanh.",
    "home.features.riskTitle": "Thang rủi ro đáng tin",
    "home.features.riskDesc":
      "Mỗi hóa đơn được chấm điểm theo dòng tiền, tín nhiệm người mua và lịch sử hoàn trả.",
    "home.features.escrowTitle": "Ký quỹ thông minh, giải ngân nhanh",
    "home.features.escrowDesc":
      "Vốn được giữ an toàn đến khi đạt điều kiện, rồi giải ngân cho SME trong vài giờ.",
    "home.features.returnsTitle": "Lợi suất minh bạch",
    "home.features.returnsDesc":
      "APR, kỳ hạn và phí rõ ràng để nhà đầu tư chọn đúng khoản.",
    "home.features.emergencyTitle": "Luồng thanh khoản khẩn cấp",
    "home.features.emergencyDesc":
      "SME có thể vào luồng ưu tiên với mức phí cao hơn khi cần tiền gấp.",
    "home.sections.howEyebrow": "Cách hoạt động",
    "home.sections.howTitle": "Ba bước kích hoạt vốn lưu động.",
    "home.sections.howDescription":
      "Nền tảng dẫn dắt SME và nhà đầu tư qua quy trình đơn giản, an toàn.",
    "home.steps.step1Title": "SME đăng hóa đơn",
    "home.steps.step1Desc":
      "Tải hóa đơn, đặt mục tiêu huy động và chọn mức lợi suất.",
    "home.steps.step2Title": "Nhà đầu tư tài trợ tự tin",
    "home.steps.step2Desc":
      "Chọn cơ hội, đa dạng nhanh và theo dõi lợi suất kỳ vọng.",
    "home.steps.step3Title": "Quy trình hoàn trả thông minh",
    "home.steps.step3Desc":
      "Nhắc lịch tự động và giải ngân ký quỹ giúp hoàn trả đúng hạn.",
    "home.sections.pulseEyebrow": "Nhịp thị trường",
    "home.sections.pulseTitle": "Thông tin thời gian thực từ kinh tế hóa đơn.",
    "home.sections.pulseDescription":
      "Nhà đầu tư thấy nhu cầu, SME thấy vốn sẵn có, quản trị giữ hệ thống khỏe.",
    "home.sections.testimonialsEyebrow": "Chứng thực",
    "home.sections.testimonialsTitle":
      "SME và nhà đầu tư tin tưởng InvoiceFlow.",
    "home.sections.testimonialsDescription":
      "Chia sẻ thực tế từ các đội ngũ dùng nền tảng để tăng tốc.",
    "home.testimonials.linhQuote":
      "InvoiceFlow rút ngắn thời gian gọi vốn từ vài tuần xuống vài ngày. Chúng tôi có thể nhận đơn hàng lớn hơn với sự tự tin.",
    "home.testimonials.minhQuote":
      "Thị trường minh bạch và thang rủi ro giúp tôi xây danh mục đúng mục tiêu.",
    "home.testimonials.saraQuote":
      "Luồng khẩn cấp giúp chúng tôi vượt qua giai đoạn thiếu tiền theo mùa mà không ảnh hưởng nhà cung cấp.",
    "home.auth.eyebrow": "Bắt đầu",
    "home.auth.title": "Truy cập thị trường trong vài phút.",
    "home.auth.description":
      "Tạo tài khoản miễn phí để gửi hóa đơn hoặc tài trợ cơ hội đã xác minh.",
    "home.auth.secureTitle": "Onboarding an toàn",
    "home.auth.secureDesc":
      "Dùng JWT và phân quyền theo vai trò để bảo vệ từng dashboard.",
    "home.auth.roleTitle": "Thiết lập vai trò nhanh",
    "home.auth.roleDesc":
      "Chọn nhà đầu tư hoặc SME để cá nhân hóa onboarding ngay lập tức.",
    "home.auth.fullName": "Họ và tên",
    "home.auth.password": "Nhập mật khẩu",
    "home.auth.passwordCreate": "Tạo mật khẩu",
    "home.auth.roleLabel": "Vai trò",
    "home.auth.createAccount": "Tạo tài khoản",
    "home.auth.loggedInAs": "Đã đăng nhập với vai trò {role}.",
    "home.auth.accountCreated": "Đã tạo tài khoản và đăng nhập.",
    "home.auth.loginFailed": "Đăng nhập thất bại.",
    "home.auth.registerFailed": "Đăng ký thất bại.",
    "home.ready.eyebrow": "Sẵn sàng khởi động",
    "home.ready.title":
      "Bắt đầu tài trợ hóa đơn hoặc mở khóa thanh khoản SME ngay hôm nay.",
    "home.ready.description":
      "Tham gia mạng lưới sớm để định hình tương lai nền tảng blockchain.",
    "home.ready.joinInvestor": "Tham gia với vai trò nhà đầu tư",
    "home.ready.applySme": "Đăng ký SME",
    "home.footer.about": "Giới thiệu",
    "home.footer.risk": "Chính sách rủi ro",
    "home.footer.compliance": "Tuân thủ",
    "home.footer.contact": "Liên hệ",
    "home.footer.tagline":
      "InvoiceFlow. Xây dựng sức bền SME với nguồn vốn minh bạch.",

    "admin.nav.overview": "Tổng quan",
    "admin.nav.requests": "Yêu cầu",
    "admin.nav.risk": "Tín hiệu rủi ro",
    "admin.nav.reports": "Báo cáo",
    "admin.nav.settings": "Cài đặt",
    "admin.title": "Trung tâm điều hành",
    "admin.subtitle": "Tổng quan vận hành",
    "admin.exportReport": "Xuất báo cáo",
    "admin.newPolicy": "Chính sách mới",
    "admin.fundingVolume": "Khối lượng huy động",
    "admin.last30Days": "30 ngày gần nhất",
    "admin.week": "Tuần {count}",
    "admin.riskDistribution": "Phân bổ rủi ro",
    "admin.portfolioMix": "Cơ cấu danh mục",
    "admin.liveInvoices": "Hóa đơn theo hạng",
    "admin.approvalQueue": "Hàng chờ phê duyệt",
    "admin.awaitingReview": "SME chờ duyệt",
    "admin.viewAll": "Xem tất cả",
    "admin.recentRequests": "Yêu cầu gần đây",
    "admin.livePipeline": "Luồng huy động",
    "admin.healthy": "Ổn định",
    "admin.riskLabel": "Rủi ro",
    "admin.riskTierLabel": "Hạng rủi ro",
    "admin.tierLabel": "Hạng {tier}",
    "admin.approveTitle": "Phê duyệt hóa đơn",
    "admin.approveSubtitle": "Xem xét yêu cầu",
    "admin.approveButton": "Phê duyệt",
    "admin.markPaidTitle": "Đánh dấu đã thanh toán",
    "admin.markPaidSubtitle": "Đối soát",
    "admin.paymentAmount": "Số tiền thanh toán",
    "admin.settlementQr": "QR đối soát",
    "admin.settlementNote": "Quét để mô phỏng hoàn trả.",
    "admin.riskTierRequired": "Vui lòng nhập hạng rủi ro.",
    "admin.aprRequired": "APR phải lớn hơn 0.",
    "admin.invoiceNotFunded": "Hóa đơn chưa được huy động.",
    "admin.approved": "Đã phê duyệt hóa đơn.",
    "admin.paymentRecorded": "Đã ghi nhận thanh toán.",
    "admin.stats.activeSmes": "SME đang hoạt động",
    "admin.stats.fundedInvoices": "Hóa đơn đã huy động",
    "admin.stats.avgApr": "APR trung bình",
    "admin.stats.atRisk": "Rủi ro cao",

    "investor.nav.market": "Thị trường",
    "investor.nav.portfolio": "Danh mục",
    "investor.nav.account": "Tài khoản",
    "investor.title": "Chợ nhà đầu tư",
    "investor.subtitle": "Góc nhìn nhà đầu tư",
    "investor.search": "Tìm SME, hóa đơn, ngành",
    "investor.autoDiversify": "Tự đa dạng hóa",
    "investor.addFunds": "Nạp vốn",
    "investor.depositTitle": "Nạp vốn",
    "investor.depositSubtitle": "Nạp tiền vào ví",
    "investor.depositAmount": "Số tiền nạp",
    "investor.depositMethod": "Phương thức",
    "investor.depositMethodBank": "Chuyển khoản",
    "investor.depositMethodWallet": "Ví điện tử",
    "investor.depositConfirm": "Xác nhận nạp",
    "investor.depositQr": "QR nạp vốn",
    "investor.depositQrNote": "Quét để mô phỏng nạp tiền vào ví.",
    "investor.depositSuccess": "Đã ghi nhận nạp vốn.",
    "investor.availableSmes": "SME đang mở",
    "investor.openOpportunities": "Cơ hội hóa đơn",
    "investor.liveDeals": "{count} thương vụ",
    "investor.fundedPercent": "Đã huy động {percent}%",
    "investor.portfolioFocus": "Tập trung danh mục",
    "investor.activeInvestments": "Khoản đầu tư đang hoạt động",
    "investor.marketSignal": "Tín hiệu thị trường",
    "investor.demandHeatmap": "Bản đồ nhiệt nhu cầu",
    "investor.rising": "Tăng",
    "investor.emergencyCapital": "Vốn chờ luồng khẩn cấp: {amount}",
    "investor.stats.availableCapital": "Vốn khả dụng",
    "investor.stats.invested": "Đã đầu tư {amount}",
    "investor.stats.activeDeals": "Thương vụ đang chạy",
    "investor.stats.livePositions": "Vị thế hiện tại",
    "investor.stats.expectedYield": "Lợi suất kỳ vọng",
    "investor.stats.net": "Ròng",
    "investor.stats.impactScore": "Điểm tác động",
    "investor.stats.basedOnSmes": "Dựa trên SME hoạt động",
    "investor.fundingSubmitted": "Đã gửi yêu cầu tài trợ.",
    "investor.fundModalTitle": "Tài trợ hóa đơn",
    "investor.fundModalSubtitle": "Tài trợ",
    "investor.fundingQr": "QR tài trợ",
    "investor.fundingQrNote": "Quét để mô phỏng chuyển tiền vào ký quỹ.",
    "investor.fundAmountError": "Số tiền phải lớn hơn 0.",
    "investor.aprError": "APR phải lớn hơn 0.",
    "investor.termError": "Kỳ hạn phải lớn hơn 0.",

    "portfolio.title": "Phân tích danh mục",
    "portfolio.subtitle": "Danh mục nhà đầu tư",
    "portfolio.search": "Tìm danh mục, SME",
    "portfolio.rebalance": "Tái cân bằng",
    "portfolio.returnProgress": "Tiến độ lợi nhuận",
    "portfolio.paidOutVsInvested": "Đã trả so với đã đầu tư",
    "portfolio.returnsNote": "Lợi nhuận cập nhật theo từng kỳ trả.",
    "portfolio.totalInvested": "Tổng vốn đầu tư",
    "portfolio.totalReturned": "Tổng vốn hoàn trả",
    "portfolio.investedLabel": "đã đầu tư",
    "portfolio.returnedLabel": "đã hoàn trả",
    "portfolio.pendingPayout": "Khoản chờ trả",
    "portfolio.acrossPositions": "Trên các vị thế",
    "portfolio.paidOut": "Đã chi trả",
    "portfolio.next30Days": "30 ngày tới",
    "portfolio.nextPayout": "Kỳ trả tiếp theo",
    "portfolio.scheduled": "Dự kiến {date}",
    "portfolio.riskReserve": "Quỹ dự phòng rủi ro",
    "portfolio.heldInEscrow": "Giữ trong ký quỹ",
    "portfolio.allocation": "Phân bổ",
    "portfolio.sectorSplit": "Theo ngành",
    "portfolio.positions": "Vị thế danh mục",
    "portfolio.payoutCadence": "Nhịp chi trả",
    "portfolio.upcomingCashflow": "Dòng tiền sắp tới",
    "portfolio.estimatedPayout": "Ước tính chi trả",

    "investorSettings.title": "Cài đặt tài khoản",
    "investorSettings.subtitle": "Tài khoản nhà đầu tư",
    "investorSettings.search": "Tìm cài đặt",
    "investorSettings.wallet": "Ví",
    "investorSettings.balance": "Số dư tài trợ",
    "investorSettings.availableBalance": "Số dư khả dụng",
    "investorSettings.balanceNote": "Sẵn sàng cho cơ hội mới.",
    "investorSettings.depositFunds": "Nạp tiền",
    "investorSettings.withdrawFunds": "Rút tiền",
    "investorSettings.account": "Tài khoản",
    "investorSettings.security": "Bảo mật và liên hệ",
    "investorSettings.changeEmail": "Đổi email",
    "investorSettings.newEmail": "Email mới",
    "investorSettings.updateEmail": "Cập nhật email",
    "investorSettings.changePassword": "Đổi mật khẩu",
    "investorSettings.currentPassword": "Mật khẩu hiện tại",
    "investorSettings.newPassword": "Mật khẩu mới",
    "investorSettings.updatePassword": "Cập nhật mật khẩu",

    "sme.nav.marketplace": "Thị trường",
    "sme.nav.portfolio": "Danh mục",
    "sme.nav.settings": "Cài đặt",
    "sme.title": "Không gian vốn SME",
    "sme.subtitle": "Góc nhìn SME",
    "sme.search": "Tìm ưu đãi, nhà đầu tư, hóa đơn",
    "sme.uploadInvoice": "Tải hóa đơn",
    "sme.newRequest": "Yêu cầu mới",
    "sme.stats.fundingTarget": "Mục tiêu huy động",
    "sme.stats.goal": "Mục tiêu",
    "sme.stats.committed": "Đã cam kết",
    "sme.stats.updated": "Cập nhật",
    "sme.stats.offersPending": "Đề xuất chờ",
    "sme.stats.averageApr": "APR trung bình",
    "sme.stats.current": "Hiện tại",
    "sme.fundingStatus": "Trạng thái huy động",
    "sme.targetLine": "Mục tiêu {amount} - Kỳ hạn {months} tháng",
    "sme.committedLine": "{amount} đã cam kết",
    "sme.completePercent": "{percent}% hoàn tất",
    "sme.reviewingInvestors": "{count} nhà đầu tư đang xem",
    "sme.escrowReady": "Sẵn sàng ký quỹ khi 80%",
    "sme.sendUpdate": "Gửi cập nhật",
    "sme.adjustTerms": "Điều chỉnh điều khoản",
    "sme.investorOffers": "Đề xuất nhà đầu tư",
    "sme.pendingProposals": "Đang chờ phản hồi",
    "sme.highApr": "APR cao",
    "sme.accept": "Chấp nhận",
    "sme.negotiate": "Thương lượng",
    "sme.hangingFunds": "Vốn treo",
    "sme.emergencyHold": "Vốn khẩn cấp đang giữ",
    "sme.requestMatch": "Yêu cầu ghép",
    "sme.decline": "Từ chối",
    "sme.portfolio": "Danh mục",
    "sme.activeInvoices": "Hóa đơn hoạt động",
    "sme.nextRepayment": "Kỳ hoàn trả tiếp theo trong 12 ngày.",
    "sme.noInvoiceSubmit": "Không có hóa đơn để gửi.",
    "sme.noActiveInvoice": "Không có hóa đơn đang hoạt động",
    "sme.alreadySubmitted": "Hóa đơn đã gửi hoặc đã duyệt.",
    "sme.submitted": "Đã gửi hóa đơn để duyệt.",
    "sme.invoiceCreated": "Đã tạo hóa đơn.",
    "sme.invoiceCreatedSubmitted": "Đã tạo và gửi hóa đơn.",
    "sme.invoiceSetup": "Thiết lập hóa đơn",
    "sme.createInvoice": "Tạo hóa đơn",
    "sme.createSubmitInvoice": "Tạo và gửi hóa đơn",
    "sme.invoiceTitle": "Tiêu đề hóa đơn",
    "sme.invoiceTitlePlaceholder": "Hóa đơn giao hàng quý",
    "sme.invoiceNumber": "Số hóa đơn",
    "sme.currency": "Tiền tệ",
    "sme.termMonths": "Kỳ hạn (tháng)",
    "sme.aprAnnual": "Lãi suất năm (%)",
    "sme.aprBreakdown": "1-20%/năm · Tháng {monthly} · Quý {quarterly}",
    "sme.dueDate": "Ngày đến hạn",
    "sme.fundingTarget": "Mục tiêu huy động",
    "sme.tags": "Thẻ",
    "sme.uploadLabel": "Tải hóa đơn",
    "sme.uploadHint": "PDF hoặc hình ảnh, tạm thời là tùy chọn.",
    "sme.tagsPlaceholder": "Bán lẻ, Logistics",
    "sme.emergencyLane": "Bật luồng khẩn cấp",
    "sme.verificationQr": "QR xác thực hóa đơn",
    "sme.verificationNote": "Quét để mô phỏng phí xác thực.",
    "sme.errorTitleNumber": "Cần nhập tiêu đề và số hóa đơn.",
    "sme.errorAmount": "Số tiền phải lớn hơn 0.",
    "sme.errorTerm": "Kỳ hạn phải lớn hơn 0.",
    "sme.errorAprRange": "Lãi suất phải từ 1-20%/năm.",
    "sme.errorDueDate": "Vui lòng chọn ngày đến hạn.",
    "sme.errorTarget": "Mục tiêu huy động phải lớn hơn 0.",
    "sme.errorTargetMin":
      "Mục tiêu huy động phải lớn hơn hoặc bằng giá trị hóa đơn.",

    "smePortfolio.title": "Tổng quan danh mục",
    "smePortfolio.subtitle": "Danh mục SME",
    "smePortfolio.search": "Tìm hóa đơn, kỳ trả",
    "smePortfolio.totalReceived": "Tổng đã nhận",
    "smePortfolio.receivedLabel": "đã nhận",
    "smePortfolio.targetLabel": "mục tiêu",
    "smePortfolio.outstanding": "Còn lại",
    "smePortfolio.nextPayout": "Kỳ trả tiếp theo",
    "smePortfolio.ytd": "Trong năm",
    "smePortfolio.acrossInvoices": "Trên {count} hóa đơn",
    "smePortfolio.dueDate": "Đến hạn {date}",
    "smePortfolio.disbursementProgress": "Tiến độ giải ngân",
    "smePortfolio.receivedVsTarget": "Đã nhận so với mục tiêu",
    "smePortfolio.fundingUpdates":
      "Cập nhật khi hóa đơn được xác minh đầy đủ.",
    "smePortfolio.averageApr": "APR trung bình",
    "smePortfolio.invoiceMix": "Theo cơ cấu hóa đơn",
    "smePortfolio.activeInvestors": "Nhà đầu tư hoạt động",
    "smePortfolio.acrossInvoicesShort": "Trên các hóa đơn",
    "smePortfolio.upcomingReceipts": "Khoản thu sắp tới",
    "smePortfolio.payoutSchedule": "Lịch thanh toán",
    "smePortfolio.pipeline": "Luồng danh mục",
    "smePortfolio.cashflowActions": "Hành động dòng tiền",
    "smePortfolio.shareUpdates": "Chia sẻ cập nhật",
    "smePortfolio.keepInvestors":
      "Giữ nhà đầu tư yên tâm với cập nhật mới về giao hàng, trạng thái hóa đơn và lịch hoàn trả.",
    "smePortfolio.nextUpdate": "Cập nhật tiếp theo",
    "smePortfolio.shipment": "Xác nhận giao hàng - {eta}",
    "smePortfolio.sendUpdate": "Gửi cập nhật danh mục",

    "smeSettings.title": "Cài đặt tài khoản",
    "smeSettings.subtitle": "Tài khoản SME",
    "smeSettings.search": "Tìm cài đặt",
    "smeSettings.payouts": "Chi trả",
    "smeSettings.withdrawalBalance": "Số dư rút",
    "smeSettings.availableToWithdraw": "Có thể rút",
    "smeSettings.afterEscrow": "Sau khi giải ngân ký quỹ.",
    "smeSettings.account": "Tài khoản",
    "smeSettings.security": "Bảo mật và liên hệ",
    "smeSettings.changeEmail": "Đổi email",
    "smeSettings.newEmail": "Email mới",
    "smeSettings.updateEmail": "Cập nhật email",
    "smeSettings.changePassword": "Đổi mật khẩu",
    "smeSettings.currentPassword": "Mật khẩu hiện tại",
    "smeSettings.newPassword": "Mật khẩu mới",
    "smeSettings.updatePassword": "Cập nhật mật khẩu",

    "status.draft": "Nháp",
    "status.submitted": "Đã gửi",
    "status.approved": "Đã duyệt",
    "status.funded": "Đã huy động",
    "status.partially_paid": "Đã trả một phần",
    "status.paid": "Đã thanh toán",
    "status.confirmed": "Đã xác nhận",
    "status.pending": "Đang chờ",
    "status.review": "Xem xét",
    "status.onTrack": "Đúng tiến độ",
    "status.high": "Cao",
    "status.medium": "Trung bình",
    "status.low": "Thấp",
    "status.healthy": "Ổn định",
    "status.live": "Trực tiếp",
  },
};

const formatTemplate = (template, params) => {
  if (!params) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = params[key];
    return value === undefined || value === null ? match : String(value);
  });
};

export const getLanguage = () => {
  if (typeof window === "undefined") {
    return "en";
  }
  return localStorage.getItem(LANG_STORAGE_KEY) || "en";
};

export const setLanguage = (lang) => {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(LANG_STORAGE_KEY, lang);
  document.documentElement.lang = lang;
  window.dispatchEvent(new Event("iflow-lang"));
};

const translate = (lang, key, fallback, params) => {
  const dictionary = translations[lang] || {};
  const template = dictionary[key] || fallback || key;
  return formatTemplate(template, params);
};

export const useI18n = () => {
  const [lang, setLangState] = useState(getLanguage());

  useEffect(() => {
    const handleLang = () => {
      const nextLang = getLanguage();
      setLangState(nextLang);
      if (typeof document !== "undefined") {
        document.documentElement.lang = nextLang;
      }
    };
    handleLang();
    window.addEventListener("iflow-lang", handleLang);
    window.addEventListener("storage", handleLang);
    return () => {
      window.removeEventListener("iflow-lang", handleLang);
      window.removeEventListener("storage", handleLang);
    };
  }, []);

  const t = useCallback(
    (key, fallback, params) => translate(lang, key, fallback, params),
    [lang]
  );

  return { lang, setLang: setLanguage, t };
};
