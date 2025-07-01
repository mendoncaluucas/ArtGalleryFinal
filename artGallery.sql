-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 01/07/2025 às 19:53
-- Versão do servidor: 10.4.32-MariaDB
-- Versão do PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `artgallery`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `activities`
--

CREATE TABLE `activities` (
  `ActivityID` int(11) NOT NULL,
  `UserID` int(11) DEFAULT NULL,
  `ActionType` varchar(100) NOT NULL,
  `Details` text DEFAULT NULL,
  `Timestamp` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `artists`
--

CREATE TABLE `artists` (
  `ArtistID` int(11) NOT NULL,
  `Name` varchar(255) NOT NULL,
  `Biography` text DEFAULT NULL,
  `Nationality` varchar(100) DEFAULT NULL,
  `BirthYear` int(11) DEFAULT NULL,
  `DeceasedYear` int(11) DEFAULT NULL,
  `CreatedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `UpdatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `artists`
--

INSERT INTO `artists` (`ArtistID`, `Name`, `Biography`, `Nationality`, `BirthYear`, `DeceasedYear`, `CreatedAt`, `UpdatedAt`) VALUES
(1, 'Leonardo da Vinci', 'Leonardo di ser Piero da Vinci foi um polímata italiano do Renascimento, cujas áreas de interesse incluíam invenção, desenho, pintura, escultura, arquitetura, ciência, música, matemática, engenharia, literatura, anatomia, geologia, astronomia, botânica, paleontologia e cartografia.', 'Italiano', 1452, 1519, '2025-05-30 02:01:40', '2025-05-30 02:01:40'),
(2, 'Claude Monet', 'Pioneiro do Impressionismo francês.', 'Francês', 1840, 1926, '2025-05-30 02:01:53', '2025-05-30 02:01:53'),
(3, 'Frida Kahlo', 'Pintora mexicana conhecida por seus autorretratos intensos e coloridos.', 'Mexicana', 1907, 1954, '2025-05-30 02:01:59', '2025-05-30 02:01:59'),
(4, 'jorge', 'teste teste teste', 'Americano', 2005, NULL, '2025-06-28 01:39:36', '2025-06-28 01:39:36');

-- --------------------------------------------------------

--
-- Estrutura para tabela `artworks`
--

CREATE TABLE `artworks` (
  `ArtworkID` int(11) NOT NULL,
  `Title` varchar(255) NOT NULL,
  `Description` text DEFAULT NULL,
  `CreationYear` int(11) DEFAULT NULL,
  `Medium` varchar(100) DEFAULT NULL,
  `Dimensions` varchar(100) DEFAULT NULL,
  `ImageURL` varchar(255) DEFAULT NULL,
  `ArtistID` int(11) DEFAULT NULL,
  `CreatedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `UpdatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `status` varchar(20) NOT NULL DEFAULT 'pending_review' COMMENT 'Status da obra: pending_review, approved, rejected'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `artworks`
--

INSERT INTO `artworks` (`ArtworkID`, `Title`, `Description`, `CreationYear`, `Medium`, `Dimensions`, `ImageURL`, `ArtistID`, `CreatedAt`, `UpdatedAt`, `status`) VALUES
(1, 'A Noite Estrelada', 'Vista da janela do quarto do sanatório.', 1889, 'Óleo sobre tela', '73.7 cm × 92.1 cm', 'caminho/para/imagem.jpg', 1, '2025-05-30 02:05:42', '2025-06-27 17:21:49', 'rejected'),
(2, 'Teste', 'Obra de teste', 1472, 'Óleo sobre tela ', '73cm x 82cm', '/uploads/artworks/artworkImage-1750967732062-231833797.png', 1, '2025-06-26 19:55:32', '2025-06-27 17:21:41', 'approved'),
(3, 'Obra de teste', 'Uma obra apenas para testar as funcionalidades', 2025, 'Código em massa', '7cm x 8cm', '/uploads/artworks/artworkImage-1751071653720-543049170.png', 2, '2025-06-28 00:47:33', '2025-06-28 00:47:33', 'pending_review');

-- --------------------------------------------------------

--
-- Estrutura para tabela `notifications`
--

CREATE TABLE `notifications` (
  `NotificationID` int(11) NOT NULL,
  `UserID` int(11) DEFAULT NULL,
  `Type` varchar(50) DEFAULT NULL,
  `Message` text NOT NULL,
  `IsRead` tinyint(1) DEFAULT 0,
  `Link` varchar(255) DEFAULT NULL,
  `CreatedAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `userfavorites`
--

CREATE TABLE `userfavorites` (
  `FavoriteID` int(11) NOT NULL,
  `UserID` int(11) NOT NULL,
  `ArtworkID` int(11) NOT NULL,
  `CreatedAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `users`
--

CREATE TABLE `users` (
  `UserID` int(11) NOT NULL,
  `Name` varchar(255) NOT NULL,
  `Email` varchar(255) NOT NULL,
  `Password` varchar(255) NOT NULL,
  `IsAdmin` tinyint(1) DEFAULT 0,
  `CreatedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `UpdatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `resetPasswordToken` varchar(255) DEFAULT NULL,
  `resetPasswordExpires` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `users`
--

INSERT INTO `users` (`UserID`, `Name`, `Email`, `Password`, `IsAdmin`, `CreatedAt`, `UpdatedAt`, `resetPasswordToken`, `resetPasswordExpires`) VALUES
(1, 'Lucas Teste', 'lucas.teste@example.com', '$2b$10$zsd/h.PiYwiet7zaJ90AOuwfn9Z1K3A1sXvdRh7zdQKGuFcYvpI/e', 1, '2025-05-30 01:16:13', '2025-05-30 01:37:56', NULL, NULL),
(2, 'Maria Silva', 'maria.silva@example.com', '$2b$10$G4e4k7ziKc5NIve/QGmKPuOzMS88TXEIQH/dOZ.gkPij8jH2g4BGO', 0, '2025-05-30 17:17:14', '2025-05-30 17:17:14', NULL, NULL),
(3, 'thiago', 'lucasmendonca660@gmail.com', '$2b$10$4Jpk3XyllpcX9nRIa1au6ucbI6sF/TbQRNWFSvS6yYz/UJd9hHR/i', 0, '2025-06-27 18:33:23', '2025-06-27 18:39:36', NULL, NULL);

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `activities`
--
ALTER TABLE `activities`
  ADD PRIMARY KEY (`ActivityID`),
  ADD KEY `UserID` (`UserID`);

--
-- Índices de tabela `artists`
--
ALTER TABLE `artists`
  ADD PRIMARY KEY (`ArtistID`);

--
-- Índices de tabela `artworks`
--
ALTER TABLE `artworks`
  ADD PRIMARY KEY (`ArtworkID`),
  ADD KEY `ArtistID` (`ArtistID`);

--
-- Índices de tabela `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`NotificationID`),
  ADD KEY `UserID` (`UserID`);

--
-- Índices de tabela `userfavorites`
--
ALTER TABLE `userfavorites`
  ADD PRIMARY KEY (`FavoriteID`),
  ADD UNIQUE KEY `UserID` (`UserID`,`ArtworkID`),
  ADD KEY `ArtworkID` (`ArtworkID`);

--
-- Índices de tabela `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`UserID`),
  ADD UNIQUE KEY `Email` (`Email`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `activities`
--
ALTER TABLE `activities`
  MODIFY `ActivityID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `artists`
--
ALTER TABLE `artists`
  MODIFY `ArtistID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de tabela `artworks`
--
ALTER TABLE `artworks`
  MODIFY `ArtworkID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de tabela `notifications`
--
ALTER TABLE `notifications`
  MODIFY `NotificationID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `userfavorites`
--
ALTER TABLE `userfavorites`
  MODIFY `FavoriteID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `users`
--
ALTER TABLE `users`
  MODIFY `UserID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `activities`
--
ALTER TABLE `activities`
  ADD CONSTRAINT `activities_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE SET NULL;

--
-- Restrições para tabelas `artworks`
--
ALTER TABLE `artworks`
  ADD CONSTRAINT `artworks_ibfk_1` FOREIGN KEY (`ArtistID`) REFERENCES `artists` (`ArtistID`) ON DELETE SET NULL;

--
-- Restrições para tabelas `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE;

--
-- Restrições para tabelas `userfavorites`
--
ALTER TABLE `userfavorites`
  ADD CONSTRAINT `userfavorites_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE,
  ADD CONSTRAINT `userfavorites_ibfk_2` FOREIGN KEY (`ArtworkID`) REFERENCES `artworks` (`ArtworkID`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
